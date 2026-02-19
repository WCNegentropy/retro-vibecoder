# Manifest Specification

This document describes the complete structure of a UPG manifest (`upg.yaml`).

## Overview

```yaml
apiVersion: upg/v1

metadata:
  name: my-template
  version: 1.0.0
  description: Template description
  # ... additional metadata

prompts:
  - id: project_name
    type: string
    message: What is your project name?
  # ... additional prompts

actions:
  - type: generate
    src: template/
    dest: ./
  # ... additional actions
```

## Top-Level Fields

| Field           | Type   | Required | Description               |
| --------------- | ------ | -------- | ------------------------- |
| `apiVersion`    | string | Yes      | Schema version (`upg/v1`) |
| `metadata`      | object | Yes      | Template metadata         |
| `template`      | object | No       | Template configuration    |
| `prompts`       | array  | Yes      | Interactive prompts       |
| `actions`       | array  | Yes      | Generation actions        |
| `hooks`         | object | No       | Lifecycle hooks           |
| `validation`    | object | No       | Custom validation         |
| `documentation` | object | No       | Template documentation    |
| `enrichment`    | object | No       | Enrichment preferences    |

## Metadata Section

```yaml
metadata:
  name: my-template # Required: kebab-case identifier
  version: 1.0.0 # Required: semver version
  description: ... # Required: description
  title: My Template # Optional: display title
  tags: [react, frontend] # Optional: categorization
  icon: https://... # Optional: icon URL
  author: name # Optional: author
  license: MIT # Optional: license
  lifecycle: production # Optional: experimental|production|deprecated
  owner: team-name # Optional: owner
  repository: # Optional: source repository
    type: git
    url: https://...
```

## Prompts Section

### Prompt Types

| Type          | JSON Schema   | UI Widget      |
| ------------- | ------------- | -------------- |
| `string`      | string        | text input     |
| `int`         | integer       | number input   |
| `float`       | number        | number input   |
| `boolean`     | boolean       | checkbox       |
| `select`      | string (enum) | dropdown       |
| `multiselect` | array         | checkboxes     |
| `secret`      | string        | password input |

### Prompt Properties

```yaml
prompts:
  - id: project_name # Required: unique identifier
    type: string # Required: data type
    message: Enter name # Required: prompt text
    title: Project Name # Optional: short title
    help: Additional help # Optional: help text
    default: my-app # Optional: default value
    required: true # Optional: is required
    hidden: false # Optional: hide from UI
    validator: ^[a-z]+$ # Optional: regex pattern
    error_message: Invalid # Optional: validation error
    when: 'other_field' # Optional: conditional display
    choices: # Required for select/multiselect
      - option1
      - option2
```

### Conditional Prompts

Use `when` to show prompts conditionally:

```yaml
prompts:
  - id: use_database
    type: boolean
    message: Include database?

  - id: database_type
    type: select
    message: Which database?
    choices: [postgres, mysql]
    when: 'use_database' # Only shown if use_database is true
```

Supported expressions:

- `"field_name"` - truthy check
- `"not field_name"` - falsy check
- `"field == 'value'"` - equality
- `"field != 'value'"` - inequality

### Dynamic Defaults

Use Jinja2 expressions for computed defaults:

```yaml
prompts:
  - id: project_slug
    type: string
    message: Package name
    default: "{{ project_name | lower | replace('-', '_') }}"
    hidden: true # Computed field, hide from UI
```

## Actions Section

### Generate Action

Process template files with Jinja2:

```yaml
- type: generate
  src: template/ # Source directory
  dest: ./ # Destination directory
  exclude: # Optional: patterns to exclude
    - '*.test.ts'
  variables: # Optional: additional variables
    key: '{{ value }}'
```

### Copy Action

Binary copy without processing:

```yaml
- type: copy
  src: assets/
  dest: public/
```

### Skip Action

Conditionally exclude files:

```yaml
- type: skip
  path: 'tests/**'
  when: 'not use_testing'
```

### Command Action

Run shell commands:

```yaml
- type: command
  command: npm install
  description: Installing dependencies
  when: 'true'
  on_error: warn # fail|warn|ignore
```

### Create File Action

Create files with inline content:

```yaml
- type: create_file
  path: .env.example
  content: |
    PORT={{ port }}
    DEBUG={{ debug }}
```

## Hooks Section

```yaml
hooks:
  post_generation:
    script: hooks/post_generation.py
    description: Post-generation setup
    on_error: warn

  pre_migration:
    script: hooks/pre_migration.py
    description: Pre-update validation
    when: 'update'
    on_error: fail
```

## Template Configuration

```yaml
template:
  markers: # Files that identify this template
    - .upg-answers.yaml
    - package.json

  breaking_changes: # Document breaking changes
    - version: '2.0.0'
      changes:
        - Changed X to Y
      migration_notes: |
        How to migrate...

  smart_update:
    enabled: true
    preserve_files: # Never overwrite
      - .env.local
    regenerate_files: # Always overwrite
      - package.json
    conflict_resolution: manual # manual|auto-accept-template|auto-accept-user
```

## Documentation Section

````yaml
documentation:
  quickstart: |
    ```bash
    upg generate my-template
    cd my-project
    npm start
    ```

  custom_setup: |
    Advanced setup instructions...

  faq:
    - question: How do I customize X?
      answer: Edit the config file...
````

## Enrichment Section

Declare enrichment preferences for procedural generation:

```yaml
enrichment:
  enabled: true
  depth: standard # minimal | standard | full
  cicd: true # CI/CD workflow enrichment
  release: true # Release automation workflows
  fillLogic: true # Application logic fill
  tests: true # Test generation
  dockerProd: true # Docker production optimizations
  linting: true # Linting/formatting configs
  envFiles: true # .env.example generation
  docs: true # README enrichment
```

When included in a manifest, these preferences are used during procedural generation to control which Pass 2 enrichment strategies are applied. All fields are optional; omitted fields fall back to the depth preset defaults.

### Depth Presets

| Preset     | CI/CD | Release | Logic Fill | Tests | Docker Prod | Linting | Env Files | Docs |
| ---------- | ----- | ------- | ---------- | ----- | ----------- | ------- | --------- | ---- |
| `minimal`  | ✓     |         |            |       |             | ✓       | ✓         | ✓    |
| `standard` | ✓     | ✓       | ✓          | ✓     | ✓           | ✓       | ✓         | ✓    |
| `full`     | ✓     | ✓       | ✓          | ✓     | ✓           | ✓       | ✓         | ✓    |
