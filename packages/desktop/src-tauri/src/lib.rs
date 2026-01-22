//! UPG Desktop - Tauri Backend
//!
//! This module provides the Rust backend for the Universal Project Generator desktop application.
//! It implements the Sidecar Pattern for orchestrating external generation tools.

use serde::{Deserialize, Serialize};
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
    pub archetype: String,
    pub language: String,
    pub framework: String,
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

/// Generate a project using the specified mode
#[tauri::command]
async fn generate_project(request: GenerationRequest) -> Result<GenerationResult, String> {
    let start = std::time::Instant::now();

    // TODO: Implement actual generation logic
    // For now, return a placeholder result
    let result = GenerationResult {
        success: true,
        message: format!("Generation request received: {:?}", request.mode),
        files_generated: vec![],
        output_path: request.output_path,
        duration_ms: start.elapsed().as_millis() as u64,
    };

    Ok(result)
}

/// Get available templates from the registry
#[tauri::command]
async fn get_templates() -> Result<Vec<serde_json::Value>, String> {
    // TODO: Read from registry
    Ok(vec![])
}

/// Validate a UPG manifest file
#[tauri::command]
async fn validate_manifest(path: String) -> Result<serde_json::Value, String> {
    // TODO: Call validator
    Ok(serde_json::json!({
        "valid": true,
        "path": path,
        "errors": [],
        "warnings": []
    }))
}

/// Preview generated files without writing to disk
#[tauri::command]
async fn preview_generation(request: GenerationRequest) -> Result<serde_json::Value, String> {
    // TODO: Generate in-memory preview
    Ok(serde_json::json!({
        "files": {},
        "stack": request.stack,
        "seed": request.seed
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
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
