/**
 * README Strategy
 *
 * Generates a README.md with project information.
 */

import type { GenerationStrategy, TechStack } from '../../types.js';
import { getLanguageName } from '../../matrices/languages.js';
import { getArchetypeName } from '../../matrices/archetypes.js';

/**
 * Get setup instructions based on language
 */
function getSetupInstructions(stack: TechStack): string {
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      return `\`\`\`bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
\`\`\``;

    case 'python':
      return `\`\`\`bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py

# Run tests
pytest
\`\`\``;

    case 'go':
      return `\`\`\`bash
# Download dependencies
go mod download

# Run the application
go run .

# Build
go build -o bin/app

# Run tests
go test ./...
\`\`\``;

    case 'rust':
      return `\`\`\`bash
# Build
cargo build

# Run the application
cargo run

# Run tests
cargo test

# Build for release
cargo build --release
\`\`\``;

    case 'java':
    case 'kotlin':
      if (stack.buildTool === 'gradle') {
        return `\`\`\`bash
# Build
./gradlew build

# Run tests
./gradlew test

# Run the application
./gradlew bootRun
\`\`\``;
      }
      return `\`\`\`bash
# Build
mvn package

# Run tests
mvn test

# Run the application
mvn spring-boot:run
\`\`\``;

    case 'csharp':
      return `\`\`\`bash
# Restore dependencies
dotnet restore

# Build
dotnet build

# Run tests
dotnet test

# Run the application
dotnet run
\`\`\``;

    default:
      return `\`\`\`bash
# See project-specific documentation
make build
make test
\`\`\``;
  }
}

/**
 * README strategy - generates README.md
 */
export const ReadmeStrategy: GenerationStrategy = {
  id: 'readme',
  name: 'README Generation',
  priority: 100, // Run last

  matches: () => true, // Always applies

  apply: async ({ stack, files, projectName }) => {
    const languageName = getLanguageName(stack.language);
    const archetypeName = getArchetypeName(stack.archetype);

    const techBadges: string[] = [];
    techBadges.push(`![${languageName}](https://img.shields.io/badge/${languageName}-blue)`);
    if (stack.framework) {
      techBadges.push(`![${stack.framework}](https://img.shields.io/badge/${stack.framework}-green)`);
    }
    if (stack.database !== 'none') {
      techBadges.push(`![${stack.database}](https://img.shields.io/badge/${stack.database}-orange)`);
    }

    const content = `# ${projectName}

${techBadges.join(' ')}

A ${archetypeName.toLowerCase()} built with ${languageName}${stack.framework ? ` and ${stack.framework}` : ''}.

## Tech Stack

- **Language:** ${languageName}
- **Framework:** ${stack.framework || 'None'}
- **Database:** ${stack.database === 'none' ? 'None' : stack.database}
- **Runtime:** ${stack.runtime}

## Getting Started

### Prerequisites

${getPrerequisites(stack)}

### Installation

${getSetupInstructions(stack)}

## Project Structure

\`\`\`
${projectName}/
${getProjectStructure(stack)}
\`\`\`

## Development

${getDevelopmentInstructions(stack)}

## License

MIT
`;

    files['README.md'] = content;
  },
};

function getPrerequisites(stack: TechStack): string {
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      return '- Node.js 20+\n- pnpm 8+';
    case 'python':
      return '- Python 3.12+\n- pip';
    case 'go':
      return '- Go 1.22+';
    case 'rust':
      return '- Rust 1.75+\n- Cargo';
    case 'java':
    case 'kotlin':
      return '- JDK 17+\n- ' + (stack.buildTool === 'gradle' ? 'Gradle' : 'Maven');
    case 'csharp':
      return '- .NET SDK 8.0+';
    default:
      return '- See project documentation';
  }
}

function getProjectStructure(stack: TechStack): string {
  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      return `├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md`;

    case 'python':
      return `├── main.py
├── requirements.txt
├── tests/
└── README.md`;

    case 'go':
      return `├── main.go
├── go.mod
├── go.sum
└── README.md`;

    case 'rust':
      return `├── src/
│   └── main.rs
├── Cargo.toml
└── README.md`;

    default:
      return `├── src/
└── README.md`;
  }
}

function getDevelopmentInstructions(stack: TechStack): string {
  const instructions: string[] = [];

  if (stack.database !== 'none') {
    instructions.push(`### Database

This project uses ${stack.database}. Make sure you have it running locally or update the connection string in your environment variables.`);
  }

  if (stack.packaging === 'docker') {
    instructions.push(`### Docker

You can run this project using Docker:

\`\`\`bash
docker-compose up
\`\`\``);
  }

  return instructions.join('\n\n') || 'See setup instructions above.';
}
