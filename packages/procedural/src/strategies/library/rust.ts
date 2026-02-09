/**
 * Rust Library Strategy
 *
 * Generates Rust library crates for crates.io.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Rust library strategy
 */
export const RustLibraryStrategy: GenerationStrategy = {
  id: 'library-rust',
  name: 'Rust Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'rust',

  apply: async ({ files, projectName }) => {
    const crateName = projectName.replace(/-/g, '_');

    // Cargo.toml
    files['Cargo.toml'] = `[package]
name = "${crateName}"
version = "0.1.0"
edition = "2021"
description = "${projectName} library"
license = "MIT"
repository = ""
documentation = ""

[lib]
name = "${crateName}"
path = "src/lib.rs"

[dependencies]
thiserror = "1"

[dev-dependencies]
`;

    // src/lib.rs
    files['src/lib.rs'] = `//! ${projectName} library.

pub mod types;

/// Generate a greeting message.
///
/// # Examples
///
/// \`\`\`
/// let msg = ${crateName}::greet("World", None);
/// assert_eq!(msg, "Hello, World!");
/// \`\`\`
pub fn greet(name: &str, greeting: Option<&str>) -> String {
    let greeting = greeting.unwrap_or("Hello");
    format!("{}, {}!", greeting, name)
}

/// Add two numbers.
///
/// # Examples
///
/// \`\`\`
/// assert_eq!(${crateName}::add(1, 2), 3);
/// \`\`\`
pub fn add(a: i64, b: i64) -> i64 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_default() {
        assert_eq!(greet("World", None), "Hello, World!");
    }

    #[test]
    fn test_greet_custom() {
        assert_eq!(greet("World", Some("Hi")), "Hi, World!");
    }

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
    }
}
`;

    // src/types.rs
    files['src/types.rs'] = `//! Common types for ${projectName}.

use thiserror::Error;

/// Library error type.
#[derive(Error, Debug)]
pub enum ${crateName.charAt(0).toUpperCase() + crateName.slice(1)}Error {
    /// An unknown error occurred.
    #[error("unknown error: {0}")]
    Unknown(String),
}
`;

    // examples/basic.rs
    files['examples/basic.rs'] = `//! Basic usage example.

fn main() {
    let msg = ${crateName}::greet("World", None);
    println!("{msg}");

    let sum = ${crateName}::add(1, 2);
    println!("1 + 2 = {sum}");
}
`;

    // .gitignore
    files['.gitignore'] = `target/
Cargo.lock
`;

    // Makefile
    files['Makefile'] = `CARGO := cargo

.PHONY: build test lint fmt doc clean publish

build:
\t$(CARGO) build

test:
\t$(CARGO) test

lint:
\t$(CARGO) clippy -- -D warnings

fmt:
\t$(CARGO) fmt

doc:
\t$(CARGO) doc --open

clean:
\t$(CARGO) clean

publish:
\t$(CARGO) publish
`;
  },
};
