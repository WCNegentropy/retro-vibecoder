/**
 * Desktop Strategies
 *
 * Strategies for generating desktop application projects.
 */

// Electron
export { ElectronStrategy } from './electron.js';

// Tauri
export { TauriStrategy } from './tauri.js';

// Qt
export { QtStrategy } from './qt.js';

// Flutter
export { FlutterStrategy } from './flutter.js';

import { ElectronStrategy } from './electron.js';
import { TauriStrategy } from './tauri.js';
import { QtStrategy } from './qt.js';
import { FlutterStrategy } from './flutter.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All Desktop strategies
 */
export const DesktopStrategies: GenerationStrategy[] = [
  ElectronStrategy,
  TauriStrategy,
  QtStrategy,
  FlutterStrategy,
];
