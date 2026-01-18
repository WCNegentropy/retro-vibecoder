# React Starter Template

A production-ready React application scaffold with TypeScript, Vite, ESLint, Prettier, and optional testing and Docker support.

## Features

- React 18 with hooks
- Vite for fast development and building
- Optional TypeScript support
- Configurable ESLint (Standard, Airbnb, or Google style)
- Prettier for code formatting
- Optional Vitest + React Testing Library
- Optional Dockerfile for containerization
- Optional GitHub Actions CI workflow

## Usage

```bash
# Generate with defaults
upg generate react-starter

# Generate with custom options
upg generate react-starter \
  --project-name my-app \
  --use-typescript \
  --eslint-style airbnb
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `project_name` | string | my-react-app | Project name |
| `description` | string | A React application | Project description |
| `author_name` | string | (from env) | Author name |
| `use_typescript` | boolean | true | Include TypeScript |
| `eslint_style` | select | standard | ESLint configuration |
| `use_testing` | boolean | true | Include testing setup |
| `use_docker` | boolean | false | Include Docker files |
| `use_ci` | boolean | true | Include GitHub Actions |

## After Generation

1. Navigate to your project: `cd <project-name>`
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Open http://localhost:3000

## License

MIT
