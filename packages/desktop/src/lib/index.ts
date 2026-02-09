/**
 * UPG Desktop Library Exports
 *
 * All Tauri integration (sidecar execution, manifest validation, generation)
 * is consolidated in the useTauriGenerate hook.
 */

export {
  isTauri,
  executeSidecar,
  validateManifest,
  createOutputAccumulator,
  formatOutput,
  useTauriGenerate,
} from '../hooks/useTauriGenerate';

export type {
  SidecarStatus,
  SidecarEvent,
  SidecarConfig,
  SidecarResult,
  StreamHandler,
} from '../hooks/useTauriGenerate';
