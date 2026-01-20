# Getting Started

This guide will help you get started with the Universal Project Generator.

## Installation

### From Source (Phase 1.5 - Current)

```bash
# Clone the repository
git clone https://github.com/retro-vibecoder/retro-vibecoder-upg.git
cd retro-vibecoder-upg

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Using npm (Coming in Phase 2)

```bash
npm install -g @retro-vibecoder/cli
```

### Verify Installation

```bash
pnpm --filter @retro-vibecoder/cli --version
```

## Your First Project

### Option 1: Procedural Generation (Phase 1.5 - Available Now)

Generate a project from a seed number:

```bash
# Generate a project from seed 82910 (Rust + Axum + PostgreSQL)
pnpm --filter @retro-vibecoder/cli seed 82910 --output ./my-rust-api

# Generate from seed 99123 (Python + FastAPI + MongoDB)
pnpm --filter @retro-vibecoder/cli seed 99123 --output ./my-python-api

# Generate from seed 55782 (React + Vite + TypeScript)
pnpm --filter @retro-vibecoder/cli seed 55782 --output ./my-react-app
```

You can also specify constraints:

```bash
# Force a specific archetype and language
upg seed 12345 --archetype backend --language rust --output ./my-project

# Force a specific framework
upg seed 67890 --framework express --output ./my-express-api
```

### Option 2: Discover Multiple Projects

Run a procedural sweep to generate and optionally validate multiple projects:

```bash
# Generate 10 random projects
pnpm --filter @retro-vibecoder/cli sweep --count 10 --output ./generated-projects

# Generate and validate 100 projects, save successful ones to registry
pnpm --filter @retro-vibecoder/cli sweep --count 100 --validate --save-registry ./registry/manifests/generated.json --verbose
```

### Option 3: Manifest-Based Generation (Phase 2 - Coming Soon)

```bash
# Generate a React project from a manifest
upg generate react-starter

# Follow the prompts
? What is your project name? my-app
? Include TypeScript support? Yes
? Which ESLint style? Standard
? Include testing? Yes
```

### 2. Navigate and Run

```bash
cd my-project
# For Node.js/TypeScript projects
npm install
npm run dev

# For Rust projects
cargo run

# For Python projects
pip install -r requirements.txt
python main.py
```

## Creating Your Own Template

### 1. Initialize a Manifest

```bash
mkdir my-template
cd my-template
upg init
```

This creates a `upg.yaml` file with a basic structure.

### 2. Edit the Manifest

```yaml
apiVersion: upg/v1

metadata:
  name: my-template
  version: 1.0.0
  description: My custom template

prompts:
  - id: project_name
    type: string
    message: What is your project name?
    default: my-project
    required: true

actions:
  - type: generate
    src: template/
    dest: ./
```

### 3. Create Template Files

Create a `template/` directory with your template files:

```
my-template/
├── upg.yaml
└── template/
    ├── package.json.jinja
    └── README.md.jinja
```

Use Jinja2 syntax for dynamic content:

```json
// template/package.json.jinja
{
  "name": "{{ project_name }}",
  "version": "0.1.0"
}
```

### 4. Validate Your Template

```bash
upg validate .
```

### 5. Test Generation

```bash
upg test .
```

## Next Steps

- Read the [Manifest Specification](./template-author/manifest-spec.md)
- Explore [Example Templates](./template-author/examples.md)
- Learn about [Publishing](./template-author/publishing-guide.md)
