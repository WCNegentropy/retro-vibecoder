//! UPG Desktop - Tauri Backend
//!
//! This module provides the Rust backend for the Universal Project Generator desktop application.
//! It implements the Sidecar Pattern for orchestrating external generation tools.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

/// Generation mode for projects
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GenerationMode {
    /// Generate from UPG manifest template
    Manifest,
    /// Generate from seed using procedural engine
    Procedural,
    /// Hybrid: procedural base with manifest overlay
    Hybrid,
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
    /// For Manifest mode: path to upg.yaml
    pub manifest_path: Option<String>,
    /// For Procedural mode: seed number
    pub seed: Option<u64>,
    /// For Procedural mode: explicit stack config
    pub stack: Option<TechStackConfig>,
    /// Output directory
    pub output_path: String,
    /// User-provided answers (for Manifest mode)
    pub answers: Option<serde_json::Value>,
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

/// Response from procedural bridge script
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

/// Get the path to the procedural bridge script and the working directory for execution
fn get_bridge_paths(app: &tauri::AppHandle) -> Result<BridgePaths, String> {
    #[cfg(debug_assertions)]
    {
        // In development, use the source directory
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let desktop_dir = PathBuf::from(manifest_dir.replace("/src-tauri", ""));
        let script_path = desktop_dir.join("scripts/procedural-bridge.mjs");

        // Working directory should be the desktop package root for proper module resolution
        Ok(BridgePaths {
            script_path,
            working_dir: desktop_dir,
        })
    }
    #[cfg(not(debug_assertions))]
    {
        let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
        // In release, use the bundled self-contained script
        let script_path = resource_dir.join("dist-scripts/procedural-bridge.mjs");

        // Working directory can be the resource directory
        // The bundled script doesn't need node_modules - all dependencies are inlined
        Ok(BridgePaths {
            script_path,
            working_dir: resource_dir,
        })
    }
}

/// Build command arguments for the procedural bridge
fn build_bridge_args(
    action: &str,
    seed: u64,
    output_path: Option<&str>,
    stack: &Option<TechStackConfig>,
) -> Vec<String> {
    let mut args = vec![action.to_string(), seed.to_string()];

    // Add output path for generate action
    if let Some(path) = output_path {
        args.push(path.to_string());
    }

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

/// Execute the procedural bridge script
fn execute_bridge(paths: &BridgePaths, args: Vec<String>) -> Result<BridgeResponse, String> {
    let output = Command::new("node")
        .arg(&paths.script_path)
        .args(&args)
        .current_dir(&paths.working_dir)
        .output()
        .map_err(|e| {
            format!(
                "Failed to execute procedural bridge: {}. Script: {:?}, Working dir: {:?}",
                e, paths.script_path, paths.working_dir
            )
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // Try to parse JSON from stdout
    if !stdout.is_empty() {
        serde_json::from_str::<BridgeResponse>(&stdout).map_err(|e| {
            format!(
                "Failed to parse bridge response: {}. stdout: {}, stderr: {}",
                e, stdout, stderr
            )
        })
    } else if !stderr.is_empty() {
        // Try to parse error from stderr
        serde_json::from_str::<BridgeResponse>(&stderr)
            .map_err(|e| format!("Bridge failed. stderr: {}, parse error: {}", stderr, e))
    } else {
        Err(format!(
            "Bridge returned empty output. Exit code: {:?}, Script: {:?}, Working dir: {:?}",
            output.status.code(),
            paths.script_path,
            paths.working_dir
        ))
    }
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

/// Generate a project using the specified mode
#[tauri::command]
async fn generate_project(
    app: tauri::AppHandle,
    request: GenerationRequest,
) -> Result<GenerationResult, String> {
    let start = std::time::Instant::now();

    match request.mode {
        GenerationMode::Procedural => {
            let seed = request
                .seed
                .ok_or("Seed is required for procedural generation")?;

            // Resolve the output path to an absolute path
            let resolved_output = resolve_output_path(&request.output_path, &app)?;
            let resolved_output_str = resolved_output.to_string_lossy().to_string();

            let args =
                build_bridge_args("generate", seed, Some(&resolved_output_str), &request.stack);
            let paths = get_bridge_paths(&app)?;
            let response = execute_bridge(&paths, args)?;

            if response.success {
                let data = response.data.ok_or("Missing data in successful response")?;

                let files_generated: Vec<String> = data
                    .get("files_generated")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();

                let message = data
                    .get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Generation completed")
                    .to_string();

                Ok(GenerationResult {
                    success: true,
                    message,
                    files_generated,
                    output_path: resolved_output_str,
                    duration_ms: response
                        .duration_ms
                        .unwrap_or(start.elapsed().as_millis() as u64),
                })
            } else {
                let error = response
                    .error
                    .unwrap_or_else(|| "Unknown error".to_string());
                Ok(GenerationResult {
                    success: false,
                    message: error,
                    files_generated: vec![],
                    output_path: resolved_output_str,
                    duration_ms: start.elapsed().as_millis() as u64,
                })
            }
        }
        GenerationMode::Manifest => {
            // Resolve the output path for consistent behavior
            let resolved_output = resolve_output_path(&request.output_path, &app)?;
            let resolved_output_str = resolved_output.to_string_lossy().to_string();

            // TODO: Implement manifest-based generation via Copier sidecar
            Ok(GenerationResult {
                success: false,
                message: "Manifest mode not yet implemented in Rust backend. Use sidecar.ts for Copier integration.".to_string(),
                files_generated: vec![],
                output_path: resolved_output_str,
                duration_ms: start.elapsed().as_millis() as u64,
            })
        }
        GenerationMode::Hybrid => {
            // Resolve the output path for consistent behavior
            let resolved_output = resolve_output_path(&request.output_path, &app)?;
            let resolved_output_str = resolved_output.to_string_lossy().to_string();

            // TODO: Implement hybrid mode
            Ok(GenerationResult {
                success: false,
                message: "Hybrid mode not yet implemented".to_string(),
                files_generated: vec![],
                output_path: resolved_output_str,
                duration_ms: start.elapsed().as_millis() as u64,
            })
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

/// Preview generated files without writing to disk
#[tauri::command]
async fn preview_generation(
    app: tauri::AppHandle,
    request: GenerationRequest,
) -> Result<PreviewResult, String> {
    match request.mode {
        GenerationMode::Procedural => {
            let seed = request
                .seed
                .ok_or("Seed is required for procedural preview")?;

            let args = build_bridge_args("preview", seed, None, &request.stack);
            let paths = get_bridge_paths(&app)?;
            let response = execute_bridge(&paths, args)?;

            if response.success {
                let data = response.data.ok_or("Missing data in successful response")?;

                // Extract files from response
                let files: std::collections::HashMap<String, String> = data
                    .get("files")
                    .and_then(|v| v.as_object())
                    .map(|obj| {
                        obj.iter()
                            .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                            .collect()
                    })
                    .unwrap_or_default();

                // Extract stack from response
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
        GenerationMode::Manifest => {
            // For manifest mode, we would need to process the template
            // without writing files. This is more complex and requires
            // the Copier sidecar or template processing.
            Err("Manifest preview not yet implemented in Rust backend".to_string())
        }
        GenerationMode::Hybrid => Err("Hybrid preview not yet implemented".to_string()),
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
