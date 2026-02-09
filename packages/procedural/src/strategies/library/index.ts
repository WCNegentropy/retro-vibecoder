/**
 * Library Strategies
 *
 * Strategies for generating reusable library/package projects.
 */

// TypeScript/JavaScript
export { TypeScriptLibraryStrategy } from './typescript.js';

// Python
export { PythonLibraryStrategy } from './python.js';

// Rust
export { RustLibraryStrategy } from './rust.js';

// Go
export { GoLibraryStrategy } from './go.js';

// JVM (Java, Kotlin)
export { JavaLibraryStrategy, KotlinLibraryStrategy } from './jvm.js';

// C#
export { CSharpLibraryStrategy } from './csharp.js';

// C++
export { CppLibraryStrategy } from './cpp.js';

// Ruby
export { RubyGemStrategy } from './ruby.js';

// PHP
export { PhpLibraryStrategy } from './php.js';

import { TypeScriptLibraryStrategy } from './typescript.js';
import { PythonLibraryStrategy } from './python.js';
import { RustLibraryStrategy } from './rust.js';
import { GoLibraryStrategy } from './go.js';
import { JavaLibraryStrategy, KotlinLibraryStrategy } from './jvm.js';
import { CSharpLibraryStrategy } from './csharp.js';
import { CppLibraryStrategy } from './cpp.js';
import { RubyGemStrategy } from './ruby.js';
import { PhpLibraryStrategy } from './php.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All Library strategies
 */
export const LibraryStrategies: GenerationStrategy[] = [
  TypeScriptLibraryStrategy,
  PythonLibraryStrategy,
  RustLibraryStrategy,
  GoLibraryStrategy,
  JavaLibraryStrategy,
  KotlinLibraryStrategy,
  CSharpLibraryStrategy,
  CppLibraryStrategy,
  RubyGemStrategy,
  PhpLibraryStrategy,
];
