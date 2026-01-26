//! UPG Desktop - Tauri Backend
//!
//! This module provides the Rust backend for the Universal Project Generator desktop application.
//! It implements the Sidecar Pattern for orchestrating external generation tools.

use serde::{Deserialize, Serialize};
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
        let script_path = resource_dir.join("procedural-bridge.mjs");

        // In release, use the resource directory as working directory
        // The bundled node_modules should be available there
        Ok(BridgePaths {
            script_path,
            working_dir: resource_dir,
        })
    }
}

/// Build command arguments for the procedural bridge
fn build_bridge_args(action: &str, seed: u64, output_path: Option<&str>, stack: &Option<TechStackConfig>) -> Vec<String> {
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
        .map_err(|e| format!("Failed to execute procedural bridge: {}. Script: {:?}, Working dir: {:?}",
            e, paths.script_path, paths.working_dir))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // Try to parse JSON from stdout
    if !stdout.is_empty() {
        serde_json::from_str::<BridgeResponse>(&stdout)
            .map_err(|e| format!("Failed to parse bridge response: {}. stdout: {}, stderr: {}", e, stdout, stderr))
    } else if !stderr.is_empty() {
        // Try to parse error from stderr
        serde_json::from_str::<BridgeResponse>(&stderr)
            .map_err(|e| format!("Bridge failed. stderr: {}, parse error: {}", stderr, e))
    } else {
        Err(format!("Bridge returned empty output. Exit code: {:?}, Script: {:?}, Working dir: {:?}",
            output.status.code(), paths.script_path, paths.working_dir))
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
async fn generate_project(app: tauri::AppHandle, request: GenerationRequest) -> Result<GenerationResult, String> {
    let start = std::time::Instant::now();

    match request.mode {
        GenerationMode::Procedural => {
            let seed = request.seed.ok_or("Seed is required for procedural generation")?;

            // Resolve the output path to an absolute path
            let resolved_output = resolve_output_path(&request.output_path, &app)?;
            let resolved_output_str = resolved_output.to_string_lossy().to_string();

            let args = build_bridge_args("generate", seed, Some(&resolved_output_str), &request.stack);
            let paths = get_bridge_paths(&app)?;
            let response = execute_bridge(&paths, args)?;

            if response.success {
                let data = response.data.ok_or("Missing data in successful response")?;

                let files_generated: Vec<String> = data
                    .get("files_generated")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
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
                    duration_ms: response.duration_ms.unwrap_or(start.elapsed().as_millis() as u64),
                })
            } else {
                let error = response.error.unwrap_or_else(|| "Unknown error".to_string());
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

/// Get available templates from the registry
#[tauri::command]
async fn get_templates() -> Result<Vec<serde_json::Value>, String> {
    // TODO: Read from registry
    // For now, return empty list - templates will be loaded from the filesystem
    Ok(vec![])
}

/// Validate a UPG manifest file
#[tauri::command]
async fn validate_manifest(path: String) -> Result<serde_json::Value, String> {
    // TODO: Implement validation via core package
    // For now, return a basic validation result
    Ok(serde_json::json!({
        "valid": true,
        "path": path,
        "errors": [],
        "warnings": []
    }))
}

/// Preview result structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewResult {
    pub files: std::collections::HashMap<String, String>,
    pub stack: Option<serde_json::Value>,
    pub seed: Option<u64>,
}

/// Preview generated files without writing to disk
#[tauri::command]
async fn preview_generation(app: tauri::AppHandle, request: GenerationRequest) -> Result<PreviewResult, String> {
    match request.mode {
        GenerationMode::Procedural => {
            let seed = request.seed.ok_or("Seed is required for procedural preview")?;

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
                let error = response.error.unwrap_or_else(|| "Unknown error".to_string());
                Err(error)
            }
        }
        GenerationMode::Manifest => {
            // For manifest mode, we would need to process the template
            // without writing files. This is more complex and requires
            // the Copier sidecar or template processing.
            Err("Manifest preview not yet implemented in Rust backend".to_string())
        }
        GenerationMode::Hybrid => {
            Err("Hybrid preview not yet implemented".to_string())
        }
    }
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
            preview_generation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
