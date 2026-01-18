# Getting Started

This guide will help you get started with the Universal Project Generator.

## Installation

### Using npm

```bash
npm install -g @retro-vibecoder/cli
```

### Using pnpm

```bash
pnpm add -g @retro-vibecoder/cli
```

### Verify Installation

```bash
upg --version
```

## Your First Project

### 1. Generate from a Template

```bash
# Generate a React project
upg generate react-starter

# Follow the prompts
? What is your project name? my-app
? Include TypeScript support? Yes
? Which ESLint style guide? Standard
? Include testing? Yes
```

### 2. Navigate and Run

```bash
cd my-app
npm install
npm run dev
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
