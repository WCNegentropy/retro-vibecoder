/**
 * Python CLI Strategies
 *
 * Generates Python CLI projects using Click or argparse.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Click CLI strategy
 */
export const ClickStrategy: GenerationStrategy = {
  id: 'click',
  name: 'Click CLI',
  priority: 10,

  matches: stack =>
    stack.language === 'python' && stack.archetype === 'cli' && stack.framework === 'click',

  apply: async ({ files, projectName }) => {
    const pkgName = projectName.replace(/-/g, '_').toLowerCase();

    // pyproject.toml
    files['pyproject.toml'] = `[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${projectName}"
version = "0.1.0"
description = "${projectName} CLI"
requires-python = ">=3.10"
dependencies = [
    "click>=8.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "ruff>=0.1.0",
    "mypy>=1.8.0",
]

[project.scripts]
${projectName} = "${pkgName}.cli:main"

[tool.ruff]
target-version = "py310"
line-length = 100

[tool.pytest.ini_options]
testpaths = ["tests"]
`;

    // Package init
    files[`${pkgName}/__init__.py`] = `"""${projectName} CLI."""

__version__ = "0.1.0"
`;

    // CLI entry point
    files[`${pkgName}/cli.py`] = `"""CLI entry point."""

import click

from ${pkgName} import __version__


@click.group()
@click.version_option(version=__version__)
def main() -> None:
    """${projectName} - A CLI tool."""


@main.command()
@click.option("--name", "-n", default="World", help="Name to greet.")
def hello(name: str) -> None:
    """Say hello."""
    click.echo(f"Hello, {name}!")


@main.command()
def info() -> None:
    """Show version info."""
    click.echo(f"${projectName} v{__version__}")


if __name__ == "__main__":
    main()
`;

    // Tests
    files['tests/__init__.py'] = '';

    files['tests/test_cli.py'] = `"""CLI tests."""

from click.testing import CliRunner

from ${pkgName}.cli import main


def test_hello_default() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["hello"])
    assert result.exit_code == 0
    assert "Hello, World!" in result.output


def test_hello_with_name() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["hello", "--name", "Test"])
    assert result.exit_code == 0
    assert "Hello, Test!" in result.output


def test_info() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["info"])
    assert result.exit_code == 0
    assert "${projectName} v" in result.output
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

.PHONY: install dev test lint format clean run

install:
\t$(PIP) install .

dev:
\t$(PIP) install -e ".[dev]"

test:
\t$(PYTHON) -m pytest -v

lint:
\truff check .
\tmypy ${pkgName}/

format:
\truff format .

clean:
\trm -rf dist build *.egg-info __pycache__ .pytest_cache .mypy_cache .ruff_cache

run:
\t$(PYTHON) -m ${pkgName}.cli
`;
  },
};

/**
 * argparse CLI strategy
 */
export const ArgparseStrategy: GenerationStrategy = {
  id: 'argparse',
  name: 'argparse CLI',
  priority: 10,

  matches: stack =>
    stack.language === 'python' && stack.archetype === 'cli' && stack.framework === 'argparse',

  apply: async ({ files, projectName }) => {
    const pkgName = projectName.replace(/-/g, '_').toLowerCase();

    // pyproject.toml
    files['pyproject.toml'] = `[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${projectName}"
version = "0.1.0"
description = "${projectName} CLI"
requires-python = ">=3.10"
dependencies = []

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "ruff>=0.1.0",
    "mypy>=1.8.0",
]

[project.scripts]
${projectName} = "${pkgName}.cli:main"

[tool.ruff]
target-version = "py310"
line-length = 100

[tool.pytest.ini_options]
testpaths = ["tests"]
`;

    // Package init
    files[`${pkgName}/__init__.py`] = `"""${projectName} CLI."""

__version__ = "0.1.0"
`;

    // CLI entry point
    files[`${pkgName}/cli.py`] = `"""CLI entry point using argparse."""

import argparse
import sys

from ${pkgName} import __version__


def cmd_hello(args: argparse.Namespace) -> None:
    """Handle the hello command."""
    print(f"Hello, {args.name}!")


def cmd_info(args: argparse.Namespace) -> None:
    """Handle the info command."""
    print(f"${projectName} v{__version__}")


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser."""
    parser = argparse.ArgumentParser(
        prog="${projectName}",
        description="${projectName} - A CLI tool",
    )
    parser.add_argument(
        "--version", action="version", version=f"%(prog)s {__version__}"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # hello command
    hello_parser = subparsers.add_parser("hello", help="Say hello")
    hello_parser.add_argument(
        "-n", "--name", default="World", help="Name to greet"
    )
    hello_parser.set_defaults(func=cmd_hello)

    # info command
    info_parser = subparsers.add_parser("info", help="Show version info")
    info_parser.set_defaults(func=cmd_info)

    return parser


def main() -> None:
    """CLI entry point."""
    parser = build_parser()
    args = parser.parse_args()

    if not hasattr(args, "func"):
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
`;

    // Tests
    files['tests/__init__.py'] = '';

    files['tests/test_cli.py'] = `"""CLI tests."""

import subprocess
import sys


def test_hello_default() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "${pkgName}.cli", "hello"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "Hello, World!" in result.stdout


def test_hello_with_name() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "${pkgName}.cli", "hello", "--name", "Test"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "Hello, Test!" in result.stdout


def test_info() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "${pkgName}.cli", "info"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "${projectName} v" in result.stdout
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

.PHONY: install dev test lint format clean run

install:
\t$(PIP) install .

dev:
\t$(PIP) install -e ".[dev]"

test:
\t$(PYTHON) -m pytest -v

lint:
\truff check .
\tmypy ${pkgName}/

format:
\truff format .

clean:
\trm -rf dist build *.egg-info __pycache__ .pytest_cache .mypy_cache .ruff_cache

run:
\t$(PYTHON) -m ${pkgName}.cli
`;
  },
};
