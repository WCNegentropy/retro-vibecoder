/**
 * UPG Desktop Library Exports
 *
 * All Tauri integration (manifest validation, generation) is consolidated
 * in the useTauriGenerate hook. The CLI binary is bundled as a resource
 * and invoked via Rust std::process::Command — no sidecar shell plugin needed.
 */

export {
  isTauri,
  validateManifest,
  formatOutput,
  useTauriGenerate,
} from '../hooks/useTauriGenerate';
