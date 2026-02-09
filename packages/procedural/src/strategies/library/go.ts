/**
 * Go Library Strategy
 *
 * Generates Go library modules.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Go library strategy
 */
export const GoLibraryStrategy: GenerationStrategy = {
  id: 'library-go',
  name: 'Go Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'go',

  apply: async ({ files, projectName }) => {
    const pkgName = projectName.replace(/-/g, '').toLowerCase();

    // go.mod
    files['go.mod'] = `module ${projectName}

go 1.22
`;

    // Package source
    files[`${pkgName}.go`] = `// Package ${pkgName} provides core library functions.
package ${pkgName}

import "fmt"

// Greet generates a greeting message.
func Greet(name string, greeting ...string) string {
	g := "Hello"
	if len(greeting) > 0 && greeting[0] != "" {
		g = greeting[0]
	}
	return fmt.Sprintf("%s, %s!", g, name)
}

// Add returns the sum of two integers.
func Add(a, b int) int {
	return a + b
}
`;

    // Tests
    files[`${pkgName}_test.go`] = `package ${pkgName}

import "testing"

func TestGreetDefault(t *testing.T) {
	got := Greet("World")
	want := "Hello, World!"
	if got != want {
		t.Errorf("Greet(World) = %q, want %q", got, want)
	}
}

func TestGreetCustom(t *testing.T) {
	got := Greet("World", "Hi")
	want := "Hi, World!"
	if got != want {
		t.Errorf("Greet(World, Hi) = %q, want %q", got, want)
	}
}

func TestAdd(t *testing.T) {
	got := Add(1, 2)
	want := 3
	if got != want {
		t.Errorf("Add(1, 2) = %d, want %d", got, want)
	}
}
`;

    // doc.go
    files['doc.go'] = `// Package ${pkgName} is a Go library.
//
// Example usage:
//
//	msg := ${pkgName}.Greet("World")
//	fmt.Println(msg) // "Hello, World!"
package ${pkgName}
`;

    // examples/main.go
    files['examples/basic/main.go'] = `package main

import (
	"fmt"

	"${projectName}"
)

func main() {
	msg := ${pkgName}.Greet("World")
	fmt.Println(msg)

	sum := ${pkgName}.Add(1, 2)
	fmt.Printf("1 + 2 = %d\\n", sum)
}
`;

    // .gitignore
    files['.gitignore'] = `bin/
*.exe
*.test
*.out
`;

    // Makefile
    files['Makefile'] = `GO := go

.PHONY: test lint tidy doc clean

test:
\t$(GO) test -v ./...

lint:
\tgolangci-lint run

tidy:
\t$(GO) mod tidy

doc:
\t$(GO) doc -all

clean:
\t$(GO) clean
`;
  },
};
