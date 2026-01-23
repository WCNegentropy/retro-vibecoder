/**
 * Sweeper Pipeline
 *
 * Orchestrates the validation of generated projects.
 * Can run locally or in Docker containers.
 */

import type {
  GeneratedProject,
  ValidationResult,
  BuildStep,
  StepResult,
  TechStack,
} from '../types.js';

/**
 * Options for running the sweeper
 */
export interface SweeperOptions {
  /** Use Docker for validation (default: true) */
  useDocker?: boolean;

  /** Docker image to use (default: upg-omni-validator) */
  dockerImage?: string;

  /** Timeout for each step in milliseconds (default: 300000 = 5 min) */
  stepTimeout?: number;

  /** Total timeout in milliseconds (default: 600000 = 10 min) */
  totalTimeout?: number;

  /** Working directory for project files */
  workDir?: string;

  /** Keep project files after validation */
  keepFiles?: boolean;

  /** Verbose output */
  verbose?: boolean;
}

const DEFAULT_OPTIONS: Required<SweeperOptions> = {
  useDocker: true,
  dockerImage: 'upg-omni-validator',
  stepTimeout: 300000,
  totalTimeout: 600000,
  workDir: '/tmp/upg-sweeper',
  keepFiles: false,
  verbose: false,
};

/**
 * Detect build steps for a given tech stack
 */
export function detectBuildSteps(stack: TechStack): BuildStep[] {
  const steps: BuildStep[] = [];

  switch (stack.language) {
    case 'typescript':
    case 'javascript':
      steps.push(
        { command: 'pnpm install --frozen-lockfile', timeout: 120000 },
        { command: 'pnpm typecheck', timeout: 60000 },
        { command: 'pnpm lint', timeout: 60000 },
        { command: 'pnpm build', timeout: 120000 },
        { command: 'pnpm test', timeout: 120000 }
      );
      break;

    case 'python':
      steps.push(
        {
          command:
            'python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt',
          timeout: 120000,
        },
        { command: 'source .venv/bin/activate && ruff check .', timeout: 60000 },
        { command: 'source .venv/bin/activate && mypy .', timeout: 60000 },
        { command: 'source .venv/bin/activate && pytest', timeout: 120000 }
      );
      break;

    case 'rust':
      steps.push(
        { command: 'cargo fmt --check', timeout: 30000 },
        { command: 'cargo clippy -- -D warnings', timeout: 120000 },
        { command: 'cargo build --release', timeout: 300000 },
        { command: 'cargo test', timeout: 120000 }
      );
      break;

    case 'go':
      steps.push(
        { command: 'go mod download', timeout: 120000 },
        { command: 'golangci-lint run', timeout: 60000 },
        { command: 'go build ./...', timeout: 120000 },
        { command: 'go test ./...', timeout: 120000 }
      );
      break;

    case 'java':
    case 'kotlin':
      if (stack.buildTool === 'gradle') {
        steps.push(
          { command: './gradlew build', timeout: 300000 },
          { command: './gradlew test', timeout: 120000 }
        );
      } else {
        steps.push(
          { command: 'mvn -B package', timeout: 300000 },
          { command: 'mvn test', timeout: 120000 }
        );
      }
      break;

    case 'csharp':
      steps.push(
        { command: 'dotnet restore', timeout: 120000 },
        { command: 'dotnet build --no-restore', timeout: 120000 },
        { command: 'dotnet test --no-build', timeout: 120000 }
      );
      break;

    default:
      // Generic make-based build
      steps.push(
        { command: 'make build', timeout: 300000 },
        { command: 'make test', timeout: 120000 }
      );
  }

  return steps;
}

/**
 * Sweeper class for validating generated projects
 */
export class Sweeper {
  private options: Required<SweeperOptions>;

  constructor(options: SweeperOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate a generated project
   */
  async validate(project: GeneratedProject): Promise<ValidationResult> {
    const startTime = Date.now();
    const steps = detectBuildSteps(project.stack);
    const stepResults: StepResult[] = [];

    try {
      // Write project files to disk
      await this.writeProjectFiles(project);

      // Run each build step
      for (const step of steps) {
        const result = await this.runStep(step, project);
        stepResults.push(result);

        // Stop on first failure if not continuing on error
        if (!result.success) {
          break;
        }
      }

      const success = stepResults.every(r => r.success);

      return {
        success,
        project,
        steps: stepResults,
        durationMs: Date.now() - startTime,
        error: success ? undefined : stepResults.find(r => !r.success)?.stderr,
      };
    } catch (error) {
      return {
        success: false,
        project,
        steps: stepResults,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // Clean up if not keeping files
      if (!this.options.keepFiles) {
        await this.cleanup(project);
      }
    }
  }

  /**
   * Write project files to disk
   */
  private async writeProjectFiles(project: GeneratedProject): Promise<void> {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname, join } = await import('node:path');

    const projectDir = join(this.options.workDir, project.id);

    for (const [filePath, content] of Object.entries(project.files)) {
      const fullPath = join(projectDir, filePath);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
    }
  }

  /**
   * Run a single build step
   */
  private async runStep(step: BuildStep, project: GeneratedProject): Promise<StepResult> {
    const startTime = Date.now();
    const { join } = await import('node:path');
    const projectDir = join(this.options.workDir, project.id);

    try {
      if (this.options.useDocker) {
        return await this.runInDocker(step, projectDir);
      } else {
        return await this.runLocally(step, projectDir);
      }
    } catch (error) {
      return {
        step,
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Run command in Docker container
   */
  private async runInDocker(step: BuildStep, projectDir: string): Promise<StepResult> {
    const startTime = Date.now();
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    const timeout = step.timeout ?? this.options.stepTimeout;
    const cmd = `docker run --rm -v "${projectDir}:/app" -w /app ${this.options.dockerImage} sh -c "${step.command}"`;

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout });
      return {
        step,
        success: true,
        exitCode: 0,
        stdout,
        stderr,
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      return {
        step,
        success: false,
        exitCode: err.code ?? 1,
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? String(error),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Run command locally
   */
  private async runLocally(step: BuildStep, projectDir: string): Promise<StepResult> {
    const startTime = Date.now();
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    const timeout = step.timeout ?? this.options.stepTimeout;

    try {
      const { stdout, stderr } = await execAsync(step.command, {
        cwd: projectDir,
        timeout,
      });
      return {
        step,
        success: true,
        exitCode: 0,
        stdout,
        stderr,
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      return {
        step,
        success: false,
        exitCode: err.code ?? 1,
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? String(error),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up project files
   */
  private async cleanup(project: GeneratedProject): Promise<void> {
    const { rm } = await import('node:fs/promises');
    const { join } = await import('node:path');

    const projectDir = join(this.options.workDir, project.id);

    try {
      await rm(projectDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run a universal sweep: generate and validate multiple projects
 */
export async function runUniversalSweep(
  count: number,
  options: SweeperOptions = {}
): Promise<ValidationResult[]> {
  const { ProjectAssembler } = await import('../engine/assembler.js');
  const { AllStrategies } = await import('../strategies/index.js');

  const sweeper = new Sweeper(options);
  const results: ValidationResult[] = [];

  for (let seed = 1; seed <= count; seed++) {
    const assembler = new ProjectAssembler(seed);
    assembler.registerStrategies(AllStrategies);

    const project = await assembler.generate();

    if (options.verbose) {
      console.log(`[${seed}/${count}] Validating: ${project.id}`);
    }

    const result = await sweeper.validate(project);
    results.push(result);

    if (options.verbose) {
      console.log(`  ${result.success ? '✓' : '✗'} ${result.durationMs}ms`);
    }
  }

  return results;
}
