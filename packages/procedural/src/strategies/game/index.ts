/**
 * Game Strategies
 *
 * Strategies for generating game/interactive experience projects.
 */

// TypeScript (Phaser, PixiJS)
export { PhaserStrategy, PixiJSStrategy } from './typescript.js';

// C# (Unity, Godot Mono)
export { UnityStrategy, GodotMonoStrategy } from './csharp.js';

// C++ (SDL2, SFML)
export { SDL2Strategy, SFMLStrategy } from './cpp.js';

// Rust (Bevy, Macroquad)
export { BevyStrategy, MacroquadStrategy } from './rust.js';

import { PhaserStrategy, PixiJSStrategy } from './typescript.js';
import { UnityStrategy, GodotMonoStrategy } from './csharp.js';
import { SDL2Strategy, SFMLStrategy } from './cpp.js';
import { BevyStrategy, MacroquadStrategy } from './rust.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All Game strategies
 */
export const GameStrategies: GenerationStrategy[] = [
  PhaserStrategy,
  PixiJSStrategy,
  UnityStrategy,
  GodotMonoStrategy,
  SDL2Strategy,
  SFMLStrategy,
  BevyStrategy,
  MacroquadStrategy,
];
