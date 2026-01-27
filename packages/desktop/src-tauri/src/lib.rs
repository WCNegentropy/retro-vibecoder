//! UPG Desktop - Tauri Backend
//!
//! This module provides the Rust backend for the Universal Project Generator desktop application.
//! v1 uses the CLI (upg) as the single generation engine - no separate sidecars.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

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

/// Get the path to the UPG CLI
/// In development: uses npx upg from the monorepo
/// In production: uses the bundled upg binary
fn get_cli_command() -> (String, Vec<String>) {
    #[cfg(debug_assertions)]
    {
        // In development, use npx to run upg from the workspace
        ("npx".to_string(), vec!["upg".to_string()])
    }
    #[cfg(not(debug_assertions))]
    {
        // In production, use the bundled CLI directly via node
        // The CLI is bundled as a resource, not an external binary
        ("node".to_string(), vec![])
    }
}

/// Get the CLI script path for production builds
#[cfg(not(debug_assertions))]
fn get_cli_script_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    Ok(resource_dir.join("dist-scripts/procedural-bridge.mjs"))
}

/// Build CLI arguments for seed command
fn build_cli_args(
    seed: u64,
    output_path: &str,
    stack: &Option<TechStackConfig>,
) -> Vec<String> {
    let mut args = vec![
        "seed".to_string(),
        seed.to_string(),
        "--output".to_string(),
        output_path.to_string(),
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
    }

    args
}

/// Execute the UPG CLI and return the result
fn execute_cli(
    base_cmd: &str,
    base_args: Vec<String>,
    cli_args: Vec<String>,
    working_dir: &PathBuf,
) -> Result<(bool, String, String, Option<i32>), String> {
    let mut all_args = base_args;
    all_args.extend(cli_args);

    let output = Command::new(base_cmd)
        .args(&all_args)
        .current_dir(working_dir)
        .env("NO_COLOR", "1") // Disable color output for easier parsing
        .output()
        .map_err(|e| format!("Failed to execute CLI: {}. Command: {} {:?}", e, base_cmd, all_args))?;

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
    let path = PathBuf::from(output_path);

    if path.is_absolute() {
        return Ok(path);
    }

    // For relative paths, resolve against user's home directory or document directory
    // This gives users a predictable location for their generated projects
    if let Ok(home_dir) = app.path().home_dir() {
        return Ok(home_dir.join(output_path));
    }

    // Fallback: resolve against current directory
    std::env::current_dir()
        .map(|cwd| cwd.join(output_path))
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
            let (cmd, base_args) = get_cli_command();

            // Build CLI arguments for seed command
            let cli_args = build_cli_args(seed, &resolved_output_str, &request.stack);

            // Get working directory (project root in dev, home dir in prod)
            #[cfg(debug_assertions)]
            let working_dir = {
                let manifest_dir = env!("CARGO_MANIFEST_DIR");
                PathBuf::from(manifest_dir)
                    .parent()
                    .and_then(|p| p.parent())
                    .and_then(|p| p.parent())
                    .and_then(|p| p.parent())
                    .map(|p| p.to_path_buf())
                    .ok_or("Failed to find project root")?
            };

            #[cfg(not(debug_assertions))]
            let working_dir = app.path().home_dir().map_err(|e| e.to_string())?;

            // Execute the CLI
            let (success, stdout, stderr, exit_code) = execute_cli(&cmd, base_args, cli_args, &working_dir)?;

            let duration_ms = start.elapsed().as_millis() as u64;

            if success {
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

/// Response from procedural bridge script (used for preview only)
#[derive(Debug, Clone, Deserialize)]
struct BridgeResponse {
    success: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
    #[serde(rename = "durationMs")]
    duration_ms: Option<u64>,
}

/// Bridge script paths and working directory
struct BridgePaths {
    script_path: PathBuf,
    working_dir: PathBuf,
}

/// Get the path to the procedural bridge script (for preview functionality)
fn get_bridge_paths(app: &tauri::AppHandle) -> Result<BridgePaths, String> {
    #[cfg(debug_assertions)]
    {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let desktop_dir = PathBuf::from(manifest_dir.replace("/src-tauri", ""));
        let script_path = desktop_dir.join("scripts/procedural-bridge.mjs");
        Ok(BridgePaths {
            script_path,
            working_dir: desktop_dir,
        })
    }
    #[cfg(not(debug_assertions))]
    {
        let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
        let script_path = resource_dir.join("dist-scripts/procedural-bridge.mjs");
        Ok(BridgePaths {
            script_path,
            working_dir: resource_dir,
        })
    }
}

/// Execute the procedural bridge script (for preview only - generation uses CLI)
fn execute_bridge(paths: &BridgePaths, args: Vec<String>) -> Result<BridgeResponse, String> {
    let output = Command::new("node")
        .arg(&paths.script_path)
        .args(&args)
        .current_dir(&paths.working_dir)
        .output()
        .map_err(|e| format!("Failed to execute bridge: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !stdout.is_empty() {
        serde_json::from_str::<BridgeResponse>(&stdout)
            .map_err(|e| format!("Failed to parse response: {}. stdout: {}", e, stdout))
    } else if !stderr.is_empty() {
        serde_json::from_str::<BridgeResponse>(&stderr)
            .map_err(|e| format!("Bridge failed. stderr: {}", stderr))
    } else {
        Err("Bridge returned empty output".to_string())
    }
}

/// Preview generated files without writing to disk
/// Note: Preview still uses the bridge script for in-memory generation
/// Generation uses the CLI for actual file writing
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

            // Build bridge args for preview
            let mut args = vec!["preview".to_string(), seed.to_string()];
            if let Some(ref config) = request.stack {
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
            }

            let paths = get_bridge_paths(&app)?;
            let response = execute_bridge(&paths, args)?;

            if response.success {
                let data = response.data.ok_or("Missing data in successful response")?;

                let files: std::collections::HashMap<String, String> = data
                    .get("files")
                    .and_then(|v| v.as_object())
                    .map(|obj| {
                        obj.iter()
                            .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                            .collect()
                    })
                    .unwrap_or_default();

                let stack = data.get("stack").cloned();

                Ok(PreviewResult {
                    files,
                    stack,
                    seed: Some(seed),
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

    // Get path to the UPG CLI
    #[cfg(debug_assertions)]
    let cli_path = {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let project_root = PathBuf::from(manifest_dir)
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .ok_or("Failed to find project root")?;
        // In development, use npx to run the CLI from the monorepo
        "npx".to_string()
    };

    #[cfg(not(debug_assertions))]
    let cli_path = "upg".to_string();

    // Determine the working directory
    let cwd = if let Some(ref dir) = working_dir {
        PathBuf::from(dir)
    } else {
        app.path().home_dir().map_err(|e| e.to_string())?
    };

    // Build arguments - in dev mode, prepend 'upg' for npx
    #[cfg(debug_assertions)]
    let full_args = {
        let mut a = vec!["upg".to_string()];
        a.extend(args);
        a
    };

    #[cfg(not(debug_assertions))]
    let full_args = args;

    // Execute the command
    let output = Command::new(&cli_path)
        .args(&full_args)
        .current_dir(&cwd)
        .output()
        .map_err(|e| format!("Failed to execute UPG CLI: {}", e))?;

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

/// Generate seeds using the sweeper and save to registry
#[tauri::command]
async fn run_sweeper(
    app: tauri::AppHandle,
    count: u32,
    start_seed: Option<u64>,
    validate: bool,
) -> Result<Vec<SeedEntry>, String> {
    let registry_dir = get_registry_dir(&app)?;
    let paths = get_bridge_paths(&app)?;

    let mut entries = Vec::new();
    let start = start_seed.unwrap_or(1);

    for i in 0..count {
        let seed = start + i as u64;
        let args = build_bridge_args("preview", seed, None, &None);
        let response = execute_bridge(&paths, args)?;

        if response.success {
            if let Some(data) = response.data {
                let stack = data.get("stack").cloned().unwrap_or(serde_json::json!({}));
                let files: Vec<String> = data
                    .get("files")
                    .and_then(|f| f.as_object())
                    .map(|obj| obj.keys().cloned().collect())
                    .unwrap_or_default();

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
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
            get_templates,
            validate_manifest,
            preview_generation,
            get_seeds,
            read_manifest,
            execute_cli,
            execute_upg_cli,
            run_sweeper
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
