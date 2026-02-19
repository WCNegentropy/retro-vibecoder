//! UPG Desktop - Tauri Backend
//!
//! This module provides the Rust backend for the Universal Project Generator desktop application.
//! v1 uses the CLI (upg) as the single generation engine — the CLI binary is bundled as a
//! resource (not sidecar), executed via std::process::Command from a single Rust function.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

/// Generation mode for projects
///
/// v1 supports procedural mode only (seed → stack → files).
/// Manifest and Hybrid modes are out of scope for v1.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GenerationMode {
    /// Generate from seed using procedural engine (the only supported mode in v1)
    Procedural,
}

/// Tech stack configuration for procedural generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechStackConfig {
    pub archetype: Option<String>,
    pub language: Option<String>,
    pub framework: Option<String>,
    pub database: Option<String>,
    pub packaging: Option<String>,
    pub cicd: Option<String>,
}

/// Enrichment configuration for Pass 2
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrichmentConfig {
    /// Whether enrichment is enabled
    #[serde(default)]
    pub enabled: bool,
    /// Enrichment depth: minimal, standard, full
    #[serde(default = "default_enrichment_depth")]
    pub depth: String,
    /// Individual flag overrides (None = use depth default)
    #[serde(default)]
    pub cicd: Option<bool>,
    #[serde(default)]
    pub release: Option<bool>,
    #[serde(default)]
    pub fill_logic: Option<bool>,
    #[serde(default)]
    pub tests: Option<bool>,
    #[serde(default)]
    pub docker_prod: Option<bool>,
    #[serde(default)]
    pub linting: Option<bool>,
    #[serde(default)]
    pub env_files: Option<bool>,
    #[serde(default)]
    pub docs: Option<bool>,
}

fn default_enrichment_depth() -> String {
    "standard".to_string()
}

/// Generation request from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationRequest {
    pub mode: GenerationMode,
    /// For Procedural mode: seed number (required)
    pub seed: Option<u64>,
    /// For Procedural mode: explicit stack config (optional constraints)
    pub stack: Option<TechStackConfig>,
    /// Output directory
    pub output_path: String,
    /// Enrichment configuration (Pass 2)
    #[serde(default)]
    pub enrichment: Option<EnrichmentConfig>,
}

/// Generation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationResult {
    pub success: bool,
    pub message: String,
    pub files_generated: Vec<String>,
    pub output_path: String,
    pub duration_ms: u64,
}

/// Get the target triple for the current platform (compile-time)
fn get_target_triple() -> &'static str {
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    { "x86_64-unknown-linux-gnu" }
    #[cfg(all(target_os = "linux", target_arch = "aarch64"))]
    { "aarch64-unknown-linux-gnu" }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    { "x86_64-apple-darwin" }
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    { "aarch64-apple-darwin" }
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    { "x86_64-pc-windows-msvc" }
    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    { "aarch64-pc-windows-msvc" }
}

/// Get the path to the UPG CLI executable
/// In development: uses the built CLI from the monorepo via node
/// In production: uses the CLI binary bundled as a resource
fn get_cli_command(app: &tauri::AppHandle) -> Result<(String, Vec<String>), String> {
    #[cfg(debug_assertions)]
    {
        // In development, use the built CLI from packages/cli/dist/bin/upg.js via node
        // This is acceptable in dev because we control the environment
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let project_root = PathBuf::from(manifest_dir)
            .parent() // src-tauri
            .and_then(|p| p.parent()) // desktop
            .and_then(|p| p.parent()) // packages
            .and_then(|p| p.parent()) // project root
            .ok_or("Failed to find project root")?;

        let cli_path = project_root.join("packages/cli/dist/bin/upg.js");
        if !cli_path.exists() {
            return Err(format!(
                "CLI not built. Run 'pnpm build' first. Expected: {:?}",
                cli_path
            ));
        }

        Ok(("node".to_string(), vec![cli_path.to_string_lossy().to_string()]))
    }

    #[cfg(not(debug_assertions))]
    {
        // In production, use the CLI binary bundled as a resource
        let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
        let target = get_target_triple();

        #[cfg(windows)]
        let binary_name = format!("upg-{}.exe", target);
        #[cfg(not(windows))]
        let binary_name = format!("upg-{}", target);

        let binary_path = resource_dir.join(&binary_name);
        let binaries_subdir_path = resource_dir.join("binaries").join(&binary_name);

        if binary_path.exists() {
            return Ok((binary_path.to_string_lossy().to_string(), vec![]));
        }

        if binaries_subdir_path.exists() {
            return Ok((binaries_subdir_path.to_string_lossy().to_string(), vec![]));
        }

        Err(format!(
            "CLI binary not found: {:?} or {:?}. This is a packaging error.",
            binary_path, binaries_subdir_path
        ))
    }
}

/// Build CLI arguments for seed command
fn build_cli_args(
    seed: u64,
    output_path: &str,
    stack: &Option<TechStackConfig>,
    enrichment: &Option<EnrichmentConfig>,
) -> Vec<String> {
    let mut args = vec![
        "seed".to_string(),
        seed.to_string(),
        "--output".to_string(),
        output_path.to_string(),
        "--json".to_string(),
    ];

    // Add stack constraints if provided
    if let Some(ref config) = stack {
        if let Some(ref archetype) = config.archetype {
            args.push("--archetype".to_string());
            args.push(archetype.clone());
        }
        if let Some(ref language) = config.language {
            args.push("--language".to_string());
            args.push(language.clone());
        }
        if let Some(ref framework) = config.framework {
            args.push("--framework".to_string());
            args.push(framework.clone());
        }
        if let Some(ref database) = config.database {
            args.push("--database".to_string());
            args.push(database.clone());
        }
        if let Some(ref packaging) = config.packaging {
            args.push("--packaging".to_string());
            args.push(packaging.clone());
        }
        if let Some(ref cicd) = config.cicd {
            args.push("--cicd".to_string());
            args.push(cicd.clone());
        }
    }

    // Add enrichment flags if enabled
    if let Some(ref enrich) = enrichment {
        if enrich.enabled {
            args.push("--enrich".to_string());
            args.push("--enrich-depth".to_string());
            args.push(enrich.depth.clone());

            // Individual flag overrides (--no-enrich-X when explicitly disabled)
            if enrich.cicd == Some(false) {
                args.push("--no-enrich-cicd".to_string());
            }
            if enrich.release == Some(false) {
                args.push("--no-enrich-release".to_string());
            }
            if enrich.fill_logic == Some(false) {
                args.push("--no-enrich-logic".to_string());
            }
            if enrich.tests == Some(false) {
                args.push("--no-enrich-tests".to_string());
            }
            if enrich.docker_prod == Some(false) {
                args.push("--no-enrich-docker-prod".to_string());
            }
            if enrich.linting == Some(false) {
                args.push("--no-enrich-linting".to_string());
            }
            if enrich.env_files == Some(false) {
                args.push("--no-enrich-env".to_string());
            }
            if enrich.docs == Some(false) {
                args.push("--no-enrich-docs".to_string());
            }
        }
    }

    args
}

/// Execute a CLI command and return the result (internal helper)
fn execute_cli_internal(
    cmd: &str,
    args: Vec<String>,
    working_dir: &PathBuf,
) -> Result<(bool, String, String, Option<i32>), String> {
    let output = Command::new(cmd)
        .args(&args)
        .current_dir(working_dir)
        .env("NO_COLOR", "1") // Disable color output for easier parsing
        .env("TERM", "dumb") // Suppress ora spinner ANSI codes on piped stdout
        .output()
        .map_err(|e| format!("Failed to execute CLI: {}. Command: {} {:?}", e, cmd, args))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let success = output.status.success();
    let exit_code = output.status.code();

    Ok((success, stdout, stderr, exit_code))
}

/// List files in a directory recursively
fn list_files_recursive(dir: &PathBuf) -> Vec<String> {
    let mut files = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(relative) = path.strip_prefix(dir) {
                    files.push(relative.to_string_lossy().to_string());
                }
            } else if path.is_dir() {
                // Recurse into subdirectories
                let subfiles = list_files_recursive(&path);
                for subfile in subfiles {
                    if let Ok(relative) = path.strip_prefix(dir) {
                        files.push(format!("{}/{}", relative.to_string_lossy(), subfile));
                    }
                }
            }
        }
    }

    files
}

/// Resolve output path to an absolute path
/// If relative, resolves against the user's home directory or current directory
fn resolve_output_path(output_path: &str, app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let cleaned = output_path.strip_prefix("./").unwrap_or(output_path);
    let path = PathBuf::from(cleaned);

    if path.is_absolute() {
        return Ok(path);
    }

    // For relative paths, resolve against user's home directory or document directory
    // This gives users a predictable location for their generated projects
    if let Ok(home_dir) = app.path().home_dir() {
        return Ok(home_dir.join(cleaned));
    }

    // Fallback: resolve against current directory
    std::env::current_dir()
        .map(|cwd| cwd.join(cleaned))
        .map_err(|e| format!("Failed to resolve output path: {}", e))
}

/// Generate a project using the CLI (upg seed command)
///
/// Primary invariant: upg seed <SEED> --output <DIR> [constraints...]
/// Creates a project directory at <DIR> with a valid scaffolding for the chosen stack.
/// Exit code 0 on success, non-zero on failure.
#[tauri::command]
async fn generate_project(
    app: tauri::AppHandle,
    request: GenerationRequest,
) -> Result<GenerationResult, String> {
    let start = std::time::Instant::now();

    // v1 only supports Procedural mode
    match request.mode {
        GenerationMode::Procedural => {
            let seed = request
                .seed
                .ok_or("Seed is required for procedural generation")?;

            // Resolve the output path to an absolute path
            let resolved_output = resolve_output_path(&request.output_path, &app)?;
            let resolved_output_str = resolved_output.to_string_lossy().to_string();

            // Get CLI command and base args
            let (cmd, base_args) = get_cli_command(&app)?;

            // Build CLI arguments for seed command
            let cli_args = build_cli_args(seed, &resolved_output_str, &request.stack, &request.enrichment);

            // Combine base args and CLI args
            let mut all_args = base_args;
            all_args.extend(cli_args);

            // Get working directory (home dir in both dev and prod)
            let working_dir = app.path().home_dir().map_err(|e| e.to_string())?;

            // Execute the CLI
            let (success, stdout, stderr, exit_code) = execute_cli_internal(&cmd, all_args, &working_dir)?;

            let duration_ms = start.elapsed().as_millis() as u64;

            if let Ok(response) = serde_json::from_str::<Value>(&stdout) {
                let cli_success = response
                    .get("success")
                    .and_then(|value| value.as_bool())
                    .unwrap_or(false);

                let files_generated = response
                    .get("files_generated")
                    .and_then(|value| value.as_array())
                    .map(|files| {
                        files
                            .iter()
                            .filter_map(|file| file.as_str().map(String::from))
                            .collect::<Vec<String>>()
                    })
                    .unwrap_or_default();

                if cli_success {
                    let message = format!(
                        "Generated {} files for seed {} in {}ms",
                        files_generated.len(),
                        seed,
                        duration_ms
                    );

                    Ok(GenerationResult {
                        success: true,
                        message,
                        files_generated,
                        output_path: resolved_output_str,
                        duration_ms,
                    })
                } else {
                    let error_msg = response
                        .get("error")
                        .and_then(|value| value.as_str())
                        .unwrap_or("Generation failed")
                        .to_string();

                    Ok(GenerationResult {
                        success: false,
                        message: error_msg,
                        files_generated: vec![],
                        output_path: resolved_output_str,
                        duration_ms,
                    })
                }
            } else if success {
                // List generated files from the output directory
                let files_generated = if resolved_output.exists() {
                    list_files_recursive(&resolved_output)
                } else {
                    vec![]
                };

                let message = format!(
                    "Generated {} files for seed {} in {}ms",
                    files_generated.len(),
                    seed,
                    duration_ms
                );

                Ok(GenerationResult {
                    success: true,
                    message,
                    files_generated,
                    output_path: resolved_output_str,
                    duration_ms,
                })
            } else {
                // Extract error message from stderr or stdout
                let error_msg = if !stderr.is_empty() {
                    stderr.lines().last().unwrap_or("Generation failed").to_string()
                } else if !stdout.is_empty() {
                    stdout.lines().last().unwrap_or("Generation failed").to_string()
                } else {
                    format!("CLI exited with code {:?}", exit_code)
                };

                Ok(GenerationResult {
                    success: false,
                    message: error_msg,
                    files_generated: vec![],
                    output_path: resolved_output_str,
                    duration_ms,
                })
            }
        }
    }
}

/// Template entry structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateEntry {
    pub name: String,
    pub version: String,
    pub title: String,
    pub description: String,
    pub tags: Vec<String>,
    pub icon: Option<String>,
    pub author: Option<String>,
    pub lifecycle: String,
    pub path: String,
}

/// YAML manifest metadata (partial parse for template info)
#[derive(Debug, Deserialize)]
struct ManifestMetadata {
    name: String,
    #[serde(default = "default_version")]
    version: String,
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    icon: Option<String>,
    #[serde(default)]
    author: Option<String>,
    #[serde(default = "default_lifecycle")]
    lifecycle: String,
}

fn default_version() -> String {
    "1.0.0".to_string()
}

fn default_lifecycle() -> String {
    "production".to_string()
}

#[derive(Debug, Deserialize)]
struct ManifestFile {
    metadata: ManifestMetadata,
}

/// Get the templates directory path
fn get_templates_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        // In development, use the source templates directory
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let project_root = PathBuf::from(manifest_dir)
            .parent() // src-tauri
            .and_then(|p| p.parent()) // packages/desktop
            .and_then(|p| p.parent()) // packages
            .and_then(|p| p.parent()) // project root
            .ok_or("Failed to find project root")?;
        Ok(project_root.join("templates"))
    }
    #[cfg(not(debug_assertions))]
    {
        let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
        Ok(resource_dir.join("templates"))
    }
}

/// Get the registry directory path
fn get_registry_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let project_root = PathBuf::from(manifest_dir)
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .ok_or("Failed to find project root")?;
        Ok(project_root.join("registry"))
    }
    #[cfg(not(debug_assertions))]
    {
        let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
        Ok(resource_dir.join("registry"))
    }
}

/// Get available templates from the templates directory
#[tauri::command]
async fn get_templates(app: tauri::AppHandle) -> Result<Vec<TemplateEntry>, String> {
    let templates_dir = get_templates_dir(&app)?;
    let mut templates = Vec::new();

    if !templates_dir.exists() {
        return Ok(templates);
    }

    // Read all subdirectories in templates/
    let entries = fs::read_dir(&templates_dir).map_err(|e| {
        format!(
            "Failed to read templates directory {:?}: {}",
            templates_dir, e
        )
    })?;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        // Look for upg.yaml manifest
        let manifest_path = path.join("upg.yaml");
        if !manifest_path.exists() {
            continue;
        }

        // Parse the manifest
        let content = match fs::read_to_string(&manifest_path) {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Failed to read manifest {:?}: {}", manifest_path, e);
                continue;
            }
        };

        let manifest: ManifestFile = match serde_yaml::from_str(&content) {
            Ok(m) => m,
            Err(e) => {
                eprintln!("Failed to parse manifest {:?}: {}", manifest_path, e);
                continue;
            }
        };

        let meta = manifest.metadata;
        templates.push(TemplateEntry {
            name: meta.name.clone(),
            version: meta.version,
            title: meta.title.unwrap_or_else(|| meta.name.clone()),
            description: meta.description.unwrap_or_default(),
            tags: meta.tags,
            icon: meta.icon,
            author: meta.author,
            lifecycle: meta.lifecycle,
            path: path.to_string_lossy().to_string(),
        });
    }

    Ok(templates)
}

/// Validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub path: String,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Validate a UPG manifest file
#[tauri::command]
async fn validate_manifest(path: String) -> Result<ValidationResult, String> {
    let manifest_path = PathBuf::from(&path);

    // Check if file exists
    if !manifest_path.exists() {
        return Ok(ValidationResult {
            valid: false,
            path: path.clone(),
            errors: vec![format!("Manifest file not found: {}", path)],
            warnings: vec![],
        });
    }

    // Check file extension
    let extension = manifest_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if extension != "yaml" && extension != "yml" {
        return Ok(ValidationResult {
            valid: false,
            path: path.clone(),
            errors: vec![format!(
                "Invalid file extension '{}'. Expected .yaml or .yml",
                extension
            )],
            warnings: vec![],
        });
    }

    // Read and parse the manifest
    let content = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read manifest file: {}", e))?;

    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Parse YAML
    let manifest: serde_yaml::Value = match serde_yaml::from_str(&content) {
        Ok(m) => m,
        Err(e) => {
            return Ok(ValidationResult {
                valid: false,
                path: path.clone(),
                errors: vec![format!("YAML parse error: {}", e)],
                warnings: vec![],
            });
        }
    };

    // Validate required fields
    if manifest.get("apiVersion").is_none() {
        errors.push("Missing required field: apiVersion".to_string());
    } else if let Some(api_version) = manifest.get("apiVersion").and_then(|v| v.as_str()) {
        if api_version != "upg/v1" {
            warnings.push(format!(
                "Unknown apiVersion '{}'. Expected 'upg/v1'",
                api_version
            ));
        }
    }

    if manifest.get("metadata").is_none() {
        errors.push("Missing required field: metadata".to_string());
    } else if let Some(metadata) = manifest.get("metadata") {
        if metadata.get("name").is_none() {
            errors.push("Missing required field: metadata.name".to_string());
        }
        if metadata.get("version").is_none() {
            warnings.push("Missing recommended field: metadata.version".to_string());
        }
    }

    if manifest.get("prompts").is_none() && manifest.get("template").is_none() {
        warnings.push("Manifest has no prompts or template section".to_string());
    }

    // Check for template directory if template section exists
    if manifest.get("template").is_some() || manifest.get("actions").is_some() {
        let template_dir = manifest_path.parent().map(|p| p.join("template"));
        if let Some(ref dir) = template_dir {
            if !dir.exists() {
                warnings.push(format!(
                    "Template directory not found: {:?}",
                    dir.file_name().unwrap_or_default()
                ));
            }
        }
    }

    Ok(ValidationResult {
        valid: errors.is_empty(),
        path,
        errors,
        warnings,
    })
}

/// Preview result structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewResult {
    pub files: std::collections::HashMap<String, String>,
    pub stack: Option<serde_json::Value>,
    pub seed: Option<u64>,
}

/// Seed entry from registry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeedEntry {
    pub seed: u64,
    pub stack: serde_json::Value,
    pub files: Vec<String>,
    pub validated_at: String,
    pub tags: Vec<String>,
}

/// Registry data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryData {
    pub version: String,
    pub generated_at: String,
    pub total_entries: u32,
    pub entries: Vec<SeedEntry>,
}

/// CLI execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CLIResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub duration_ms: u64,
}

/// Response from CLI preview command
#[derive(Debug, Clone, Deserialize)]
struct CLIPreviewResponse {
    success: bool,
    data: Option<CLIPreviewData>,
    error: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct CLIPreviewData {
    seed: u64,
    #[allow(dead_code)]
    id: String,
    stack: serde_json::Value,
    files: std::collections::HashMap<String, String>,
}

/// Preview generated files without writing to disk
/// Uses the CLI preview command which outputs JSON without file writes
#[tauri::command]
async fn preview_generation(
    app: tauri::AppHandle,
    request: GenerationRequest,
) -> Result<PreviewResult, String> {
    // v1 only supports Procedural mode
    match request.mode {
        GenerationMode::Procedural => {
            let seed = request
                .seed
                .ok_or("Seed is required for procedural preview")?;

            // Get CLI command
            let (cmd, mut base_args) = get_cli_command(&app)?;

            // Build preview args: preview <seed> [constraints...]
            let mut cli_args = vec!["preview".to_string(), seed.to_string()];

            // Add stack constraints if provided
            if let Some(ref config) = request.stack {
                if let Some(ref archetype) = config.archetype {
                    cli_args.push("--archetype".to_string());
                    cli_args.push(archetype.clone());
                }
                if let Some(ref language) = config.language {
                    cli_args.push("--language".to_string());
                    cli_args.push(language.clone());
                }
                if let Some(ref framework) = config.framework {
                    cli_args.push("--framework".to_string());
                    cli_args.push(framework.clone());
                }
            }

            // Add enrichment flags if enabled
            if let Some(ref enrich) = request.enrichment {
                if enrich.enabled {
                    cli_args.push("--enrich".to_string());
                    cli_args.push("--enrich-depth".to_string());
                    cli_args.push(enrich.depth.clone());
                }
            }

            // Working directory
            let working_dir = app.path().home_dir().map_err(|e| e.to_string())?;

            // Execute CLI
            base_args.extend(cli_args);
            let (success, stdout, stderr, _exit_code) =
                execute_cli_internal(&cmd, base_args, &working_dir)?;

            if !success {
                return Err(format!("Preview failed: {}", stderr));
            }

            // Parse JSON output from stdout
            let response: CLIPreviewResponse = serde_json::from_str(&stdout)
                .map_err(|e| format!("Failed to parse CLI output: {}. stdout: {}", e, stdout))?;

            if response.success {
                let data = response.data.ok_or("Missing data in successful response")?;

                Ok(PreviewResult {
                    files: data.files,
                    stack: Some(data.stack),
                    seed: Some(data.seed),
                })
            } else {
                let error = response
                    .error
                    .unwrap_or_else(|| "Unknown error".to_string());
                Err(error)
            }
        }
    }
}

/// Get validated seeds from the registry
#[tauri::command]
async fn get_seeds(app: tauri::AppHandle) -> Result<Vec<SeedEntry>, String> {
    let registry_dir = get_registry_dir(&app)?;
    let registry_path = registry_dir.join("manifests/generated.json");

    if !registry_path.exists() {
        // Return empty list if registry doesn't exist yet
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&registry_path)
        .map_err(|e| format!("Failed to read registry: {}", e))?;

    let registry: RegistryData =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse registry: {}", e))?;

    Ok(registry.entries)
}

/// Read manifest file content
#[tauri::command]
async fn read_manifest(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read manifest: {}", e))
}

/// Execute a CLI command and return the result
#[tauri::command]
async fn execute_cli(
    app: tauri::AppHandle,
    command: String,
    args: Vec<String>,
    working_dir: Option<String>,
) -> Result<CLIResult, String> {
    let start = std::time::Instant::now();

    // Determine the working directory
    let cwd = if let Some(ref dir) = working_dir {
        PathBuf::from(dir)
    } else {
        app.path().home_dir().map_err(|e| e.to_string())?
    };

    // Build the command
    let output = Command::new(&command)
        .args(&args)
        .current_dir(&cwd)
        .output()
        .map_err(|e| format!("Failed to execute command '{}': {}", command, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok(CLIResult {
        success: output.status.success(),
        stdout,
        stderr,
        exit_code: output.status.code(),
        duration_ms: start.elapsed().as_millis() as u64,
    })
}

/// Execute the UPG CLI with specific arguments
#[tauri::command]
async fn execute_upg_cli(
    app: tauri::AppHandle,
    args: Vec<String>,
    working_dir: Option<String>,
) -> Result<CLIResult, String> {
    let start = std::time::Instant::now();

    // Get CLI command using unified function
    let (cmd, base_args) = get_cli_command(&app)?;

    // Determine the working directory
    let cwd = if let Some(ref dir) = working_dir {
        PathBuf::from(dir)
    } else {
        app.path().home_dir().map_err(|e| e.to_string())?
    };

    // Combine base args with user args
    let mut full_args = base_args;
    full_args.extend(args);

    // Execute the command
    let (success, stdout, stderr, exit_code) = execute_cli_internal(&cmd, full_args, &cwd)?;

    Ok(CLIResult {
        success,
        stdout,
        stderr,
        exit_code,
        duration_ms: start.elapsed().as_millis() as u64,
    })
}

/// Template generation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateGenerationResult {
    pub success: bool,
    pub message: String,
    pub files_generated: Vec<String>,
    pub output_path: String,
    pub duration_ms: u64,
}

/// Generate a project from a UPG manifest template using the CLI generate command
///
/// Uses: upg generate <template_path> --dest <output_dir> [--data <json>] [--use-defaults] [--force]
#[tauri::command]
async fn generate_from_template(
    app: tauri::AppHandle,
    template_path: String,
    output_path: String,
    data: Option<String>,
    use_defaults: bool,
    force: bool,
) -> Result<TemplateGenerationResult, String> {
    let start = std::time::Instant::now();

    let (cmd, base_args) = get_cli_command(&app)?;

    let mut cli_args = vec!["generate".to_string(), template_path.clone()];

    // Resolve and add output path
    let resolved_output = resolve_output_path(&output_path, &app)?;
    let resolved_output_str = resolved_output.to_string_lossy().to_string();
    cli_args.push("--dest".to_string());
    cli_args.push(resolved_output_str.clone());

    // Add optional data as JSON
    if let Some(ref json_data) = data {
        cli_args.push("--data".to_string());
        cli_args.push(json_data.clone());
    }

    if use_defaults {
        cli_args.push("--use-defaults".to_string());
    }

    if force {
        cli_args.push("--force".to_string());
    }

    // Combine base args with CLI args
    let mut all_args = base_args;
    all_args.extend(cli_args);

    let working_dir = app.path().home_dir().map_err(|e| e.to_string())?;
    let (success, stdout, stderr, exit_code) = execute_cli_internal(&cmd, all_args, &working_dir)?;

    let duration_ms = start.elapsed().as_millis() as u64;

    if success {
        let files_generated = if resolved_output.exists() {
            list_files_recursive(&resolved_output)
        } else {
            vec![]
        };

        Ok(TemplateGenerationResult {
            success: true,
            message: format!(
                "Generated {} files from template in {}ms",
                files_generated.len(),
                duration_ms
            ),
            files_generated,
            output_path: resolved_output_str,
            duration_ms,
        })
    } else {
        let error_msg = if !stderr.is_empty() {
            stderr
                .lines()
                .last()
                .unwrap_or("Template generation failed")
                .to_string()
        } else if !stdout.is_empty() {
            stdout
                .lines()
                .last()
                .unwrap_or("Template generation failed")
                .to_string()
        } else {
            format!("CLI exited with code {:?}", exit_code)
        };

        Ok(TemplateGenerationResult {
            success: false,
            message: error_msg,
            files_generated: vec![],
            output_path: resolved_output_str,
            duration_ms,
        })
    }
}

/// Generate seeds using the CLI preview command and save to registry
#[tauri::command]
async fn run_sweeper(
    app: tauri::AppHandle,
    count: u32,
    start_seed: Option<u64>,
    _validate: bool,
) -> Result<Vec<SeedEntry>, String> {
    let registry_dir = get_registry_dir(&app)?;
    let (cmd, base_args) = get_cli_command(&app)?;
    let working_dir = app.path().home_dir().map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    let start = start_seed.unwrap_or(1);

    for i in 0..count {
        let seed = start + i as u64;

        // Build CLI preview args
        let mut args = base_args.clone();
        args.push("preview".to_string());
        args.push(seed.to_string());

        // Execute CLI preview command
        let (success, stdout, _stderr, _exit_code) =
            execute_cli_internal(&cmd, args, &working_dir)?;

        if success {
            // Parse JSON output
            if let Ok(response) = serde_json::from_str::<CLIPreviewResponse>(&stdout) {
                if response.success {
                    if let Some(data) = response.data {
                        let stack = data.stack.clone();
                        let files: Vec<String> = data.files.keys().cloned().collect();

                        // Extract tags from stack
                        let mut tags = Vec::new();
                        if let Some(lang) = stack.get("language").and_then(|v| v.as_str()) {
                            tags.push(lang.to_string());
                        }
                        if let Some(fw) = stack.get("framework").and_then(|v| v.as_str()) {
                            tags.push(fw.to_string());
                        }
                        if let Some(arch) = stack.get("archetype").and_then(|v| v.as_str()) {
                            tags.push(arch.to_string());
                        }

                        entries.push(SeedEntry {
                            seed,
                            stack,
                            files,
                            validated_at: chrono::Utc::now().to_rfc3339(),
                            tags,
                        });
                    }
                }
            }
        }
    }

    // Save to registry
    let registry_path = registry_dir.join("manifests/generated.json");
    if let Some(parent) = registry_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create registry directory: {}", e))?;
    }

    // Load existing registry or create new
    let mut registry = if registry_path.exists() {
        let content = fs::read_to_string(&registry_path)
            .map_err(|e| format!("Failed to read registry: {}", e))?;
        serde_json::from_str::<RegistryData>(&content).unwrap_or(RegistryData {
            version: "1.0.0".to_string(),
            generated_at: chrono::Utc::now().to_rfc3339(),
            total_entries: 0,
            entries: vec![],
        })
    } else {
        RegistryData {
            version: "1.0.0".to_string(),
            generated_at: chrono::Utc::now().to_rfc3339(),
            total_entries: 0,
            entries: vec![],
        }
    };

    // Add new entries (avoid duplicates by seed)
    let existing_seeds: std::collections::HashSet<u64> =
        registry.entries.iter().map(|e| e.seed).collect();
    for entry in &entries {
        if !existing_seeds.contains(&entry.seed) {
            registry.entries.push(entry.clone());
        }
    }

    registry.total_entries = registry.entries.len() as u32;
    registry.generated_at = chrono::Utc::now().to_rfc3339();

    // Write updated registry
    let json = serde_json::to_string_pretty(&registry)
        .map_err(|e| format!("Failed to serialize registry: {}", e))?;
    fs::write(&registry_path, json).map_err(|e| format!("Failed to write registry: {}", e))?;

    Ok(entries)
}

/// Get a setting from the persistent store
#[tauri::command]
async fn get_setting(app: tauri::AppHandle, key: String) -> Result<serde_json::Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    match store.get(&key) {
        Some(val) => Ok(val.clone()),
        None => Ok(serde_json::Value::Null),
    }
}

/// Set a setting in the persistent store
#[tauri::command]
async fn set_setting(app: tauri::AppHandle, key: String, value: serde_json::Value) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(&key, value);
    store.save().map_err(|e| format!("Failed to save settings: {}", e))?;
    Ok(())
}

/// Get all settings from the persistent store
#[tauri::command]
async fn get_all_settings(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut settings = serde_json::Map::new();
    for (key, value) in store.entries() {
        settings.insert(key.clone(), value.clone());
    }
    Ok(serde_json::Value::Object(settings))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            generate_project,
            generate_from_template,
            get_templates,
            validate_manifest,
            preview_generation,
            get_seeds,
            read_manifest,
            execute_cli,
            execute_upg_cli,
            run_sweeper,
            get_setting,
            set_setting,
            get_all_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
