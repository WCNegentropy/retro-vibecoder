/**
 * Git Strategy
 *
 * Generates .gitignore and git-related files based on stack.
 */

import type { GenerationStrategy, TechStack } from '../../types.js';

/**
 * Get gitignore patterns for a language
 */
function getIgnorePatternsForLanguage(stack: TechStack): string[] {
  const patterns: string[] = [
    '# Dependencies',
    '',
    '# Build outputs',
    '',
    '# IDE',
    '.idea/',
    '.vscode/',
    '*.swp',
    '*.swo',
    '.DS_Store',
    '',
    '# Environment',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# Logs',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
  ];

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      patterns.splice(1, 0, 'node_modules/');
      patterns.splice(4, 0, 'dist/', 'build/', '.next/', '.nuxt/', '.output/');
      break;

    case 'python':
      patterns.splice(1, 0, '__pycache__/', '*.py[cod]', '*$py.class', '.venv/', 'venv/', 'env/');
      patterns.splice(6, 0, '.eggs/', '*.egg-info/', 'dist/', 'build/');
      break;

    case 'go':
      patterns.splice(4, 0, 'bin/', 'vendor/');
      break;

    case 'rust':
      patterns.splice(1, 0, 'target/');
      patterns.splice(4, 0, 'Cargo.lock'); // Only for libraries
      break;

    case 'java':
    case 'kotlin':
      patterns.splice(4, 0, 'target/', 'build/', '*.class', '*.jar');
      patterns.splice(1, 0, '.gradle/', 'gradle/');
      break;

    case 'csharp':
      patterns.splice(1, 0, 'bin/', 'obj/', 'packages/');
      patterns.splice(5, 0, '*.user', '*.suo');
      break;

    case 'ruby':
      patterns.splice(1, 0, '.bundle/', 'vendor/bundle/');
      patterns.splice(5, 0, '*.gem', '.ruby-version');
      break;

    case 'php':
      patterns.splice(1, 0, 'vendor/');
      patterns.splice(5, 0, 'composer.lock');
      break;
  }

  return patterns;
}

/**
 * Git strategy - generates .gitignore
 */
export const GitStrategy: GenerationStrategy = {
  id: 'git',
  name: 'Git Configuration',
  priority: 0, // Run first

  matches: () => true, // Always applies

  apply: async ({ stack, files }) => {
    const patterns = getIgnorePatternsForLanguage(stack);
    files['.gitignore'] = patterns.join('\n') + '\n';
  },
};
