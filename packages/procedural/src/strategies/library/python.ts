/**
 * Python Library Strategy
 *
 * Generates Python library packages for PyPI.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Python library strategy
 */
export const PythonLibraryStrategy: GenerationStrategy = {
  id: 'library-python',
  name: 'Python Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'python',

  apply: async ({ files, projectName }) => {
    const pkgName = projectName.replace(/-/g, '_').toLowerCase();

    // pyproject.toml
    files['pyproject.toml'] = `[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${projectName}"
version = "0.1.0"
description = "${projectName} library"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.10"
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "ruff>=0.1.0",
    "mypy>=1.8.0",
]

[tool.ruff]
target-version = "py310"
line-length = 100

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.mypy]
strict = true
`;

    // Package source
    files[`src/${pkgName}/__init__.py`] = `"""${projectName} library."""

__version__ = "0.1.0"

from ${pkgName}.lib import greet, add

__all__ = ["greet", "add"]
`;

    files[`src/${pkgName}/lib.py`] = `"""Core library functions."""


def greet(name: str, greeting: str = "Hello") -> str:
    """Generate a greeting message.

    Args:
        name: The name to greet.
        greeting: The greeting prefix.

    Returns:
        A greeting string.
    """
    return f"{greeting}, {name}!"


def add(a: int | float, b: int | float) -> int | float:
    """Add two numbers.

    Args:
        a: First number.
        b: Second number.

    Returns:
        The sum of a and b.
    """
    return a + b
`;

    files[`src/${pkgName}/py.typed`] = '';

    // Tests
    files['tests/__init__.py'] = '';

    files['tests/test_lib.py'] = `"""Library tests."""

from ${pkgName}.lib import greet, add


def test_greet_default() -> None:
    assert greet("World") == "Hello, World!"


def test_greet_custom() -> None:
    assert greet("World", greeting="Hi") == "Hi, World!"


def test_add() -> None:
    assert add(1, 2) == 3
`;

    // .gitignore
    files['.gitignore'] = `__pycache__/
*.py[cod]
*$py.class
*.egg-info/
dist/
build/
.eggs/
*.egg
.venv/
venv/
.env
.mypy_cache/
.ruff_cache/
.pytest_cache/
`;

    // Makefile
    files['Makefile'] = `PYTHON := python3
PIP := pip

.PHONY: install dev test lint format clean build publish

install:
\t$(PIP) install .

dev:
\t$(PIP) install -e ".[dev]"

test:
\t$(PYTHON) -m pytest -v

lint:
\truff check .
\tmypy src/${pkgName}/

format:
\truff format .

clean:
\trm -rf dist build *.egg-info __pycache__ .pytest_cache .mypy_cache .ruff_cache

build:
\t$(PYTHON) -m build

publish: build
\t$(PYTHON) -m twine upload dist/*
`;
  },
};
