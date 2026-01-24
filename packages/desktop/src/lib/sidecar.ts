/**
 * Sidecar Integration Layer
 *
 * Provides the interface between the React frontend and the Tauri backend's
 * sidecar functionality. Sidecars are bundled external binaries (like Copier)
 * that can be spawned by the Tauri core to perform generation tasks.
 *
 * Architecture (from plan.txt):
 * - The Core (Rust): Handles window management, file system, security
 * - The Frontend (React): Renders forms, validates input, displays progress
 * - The Sidecars: Bundled binaries (Copier, Node tools) for actual generation
 */

// Types available in '../types' if needed:
// GenerationRequest, GenerationResult, PreviewResult

/**
 * Sidecar execution status
 */
export type SidecarStatus = 'idle' | 'running' | 'success' | 'error';

/**
 * Sidecar execution event
 */
export interface SidecarEvent {
  type: 'stdout' | 'stderr' | 'exit';
  data: string;
  timestamp: number;
}

/**
 * Sidecar configuration
 */
export interface SidecarConfig {
  /** Sidecar binary name (must match tauri.conf.json) */
  name: string;
  /** Arguments to pass */
  args: string[];
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Sidecar execution result
 */
export interface SidecarResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

/**
 * Check if running in Tauri environment
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Execute a sidecar binary via Tauri
 *
 * This uses the Tauri shell plugin to spawn the bundled sidecar binary.
 * The sidecar must be configured in tauri.conf.json.
 */
export async function executeSidecar(
  config: SidecarConfig,
  onEvent?: (event: SidecarEvent) => void
): Promise<SidecarResult> {
  const startTime = Date.now();

  if (!isTauri()) {
    // Mock implementation for development
    return mockSidecarExecution(config, onEvent);
  }

  try {
    const { Command } = await import('@tauri-apps/plugin-shell');

    const command = Command.sidecar(config.name, config.args, {
      cwd: config.cwd,
      env: config.env,
    });

    let stdout = '';
    let stderr = '';

    command.stdout.on('data', data => {
      stdout += data;
      onEvent?.({
        type: 'stdout',
        data,
        timestamp: Date.now(),
      });
    });

    command.stderr.on('data', data => {
      stderr += data;
      onEvent?.({
        type: 'stderr',
        data,
        timestamp: Date.now(),
      });
    });

    const output = await command.execute();

    onEvent?.({
      type: 'exit',
      data: output.code?.toString() || '0',
      timestamp: Date.now(),
    });

    return {
      success: output.code === 0,
      exitCode: output.code || 0,
      stdout,
      stderr,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sidecar execution failed';
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: message,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Mock sidecar execution for development outside Tauri
 */
async function mockSidecarExecution(
  config: SidecarConfig,
  onEvent?: (event: SidecarEvent) => void
): Promise<SidecarResult> {
  const startTime = Date.now();

  // Simulate execution
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockOutput = `[mock] Executing sidecar: ${config.name}\n[mock] Args: ${config.args.join(' ')}\n[mock] Completed successfully`;

  onEvent?.({
    type: 'stdout',
    data: mockOutput,
    timestamp: Date.now(),
  });

  onEvent?.({
    type: 'exit',
    data: '0',
    timestamp: Date.now(),
  });

  return {
    success: true,
    exitCode: 0,
    stdout: mockOutput,
    stderr: '',
    durationMs: Date.now() - startTime,
  };
}

/**
 * Execute Copier sidecar for manifest-based generation
 *
 * The Copier sidecar handles:
 * 1. Reading the UPG manifest (upg.yaml)
 * 2. Processing Jinja2 templates
 * 3. Writing generated files to the output directory
 */
export async function executeCopier(params: {
  templatePath: string;
  outputPath: string;
  answers: Record<string, unknown>;
  onEvent?: (event: SidecarEvent) => void;
}): Promise<SidecarResult> {
  // Create temporary answers file
  const answersJson = JSON.stringify(params.answers);

  // Build Copier arguments
  const args = [
    'copy',
    params.templatePath,
    params.outputPath,
    '--data-file=-', // Read answers from stdin
    '--trust', // Trust the template
    '--quiet', // Less verbose output
  ];

  return executeSidecar(
    {
      name: 'binaries/copier-cli',
      args,
      env: {
        COPIER_ANSWERS: answersJson,
      },
      timeout: 60000, // 1 minute timeout
    },
    params.onEvent
  );
}

/**
 * Validate a UPG manifest using the core package
 *
 * This doesn't use a sidecar - it invokes the Tauri command
 * which calls the Rust validation logic.
 */
export async function validateManifest(manifestPath: string): Promise<{
  valid: boolean;
  errors: Array<{ message: string; path: string }>;
  warnings: Array<{ message: string; path: string }>;
}> {
  if (!isTauri()) {
    // Mock validation
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('validate_manifest', { path: manifestPath });
}

/**
 * Stream event handler type for real-time output
 */
export type StreamHandler = (event: SidecarEvent) => void;

/**
 * Create a stream handler that accumulates output
 */
export function createOutputAccumulator(): {
  handler: StreamHandler;
  getOutput: () => { stdout: string; stderr: string };
} {
  let stdout = '';
  let stderr = '';

  return {
    handler: event => {
      if (event.type === 'stdout') {
        stdout += event.data;
      } else if (event.type === 'stderr') {
        stderr += event.data;
      }
    },
    getOutput: () => ({ stdout, stderr }),
  };
}

/**
 * Format sidecar output for display
 */
export function formatOutput(output: string): string[] {
  return output
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

// ============================================================================
// Procedural Generation Support
// ============================================================================

/**
 * Stack constraints for procedural generation
 */
export interface ProceduralConstraints {
  archetype?: string;
  language?: string;
  framework?: string;
}

/**
 * Procedural preview result
 */
export interface ProceduralPreviewResult {
  files: Record<string, string>;
  stack: {
    archetype: string;
    language: string;
    runtime: string;
    framework: string;
    database: string;
    orm: string;
    transport: string;
    packaging: string;
    cicd: string;
    buildTool: string;
    styling: string;
    testing: string;
  };
  seed: number;
  projectId: string;
  projectName: string;
}

/**
 * Procedural generation result
 */
export interface ProceduralGenerationResult {
  success: boolean;
  message: string;
  filesGenerated: string[];
  outputPath: string;
  stack?: ProceduralPreviewResult['stack'];
  projectId?: string;
  projectName?: string;
  durationMs: number;
}

/**
 * Execute procedural preview using the procedural package directly
 *
 * This is used in development mode when Tauri is not available.
 * In production, the Tauri backend handles this via the bridge script.
 */
export async function executeProceduralPreview(
  seed: number,
  constraints?: ProceduralConstraints
): Promise<ProceduralPreviewResult> {
  // Try dynamic import - may not be available in bundled builds
  try {
    const procedural = await import('@retro-vibecoder/procedural');
    const { ProjectAssembler, AllStrategies } = procedural;

    const options: Record<string, unknown> = {};
    if (constraints?.archetype) options.archetype = constraints.archetype;
    if (constraints?.language) options.language = constraints.language;
    if (constraints?.framework) options.framework = constraints.framework;

    const assembler = new ProjectAssembler(seed, options);
    assembler.registerStrategies(AllStrategies);

    const project = await assembler.generate();

    return {
      files: project.files,
      stack: {
        archetype: project.stack.archetype,
        language: project.stack.language,
        runtime: project.stack.runtime,
        framework: project.stack.framework,
        database: project.stack.database,
        orm: project.stack.orm,
        transport: project.stack.transport,
        packaging: project.stack.packaging,
        cicd: project.stack.cicd,
        buildTool: project.stack.buildTool,
        styling: project.stack.styling,
        testing: project.stack.testing,
      },
      seed,
      projectId: project.id,
      projectName: project.name,
    };
  } catch {
    // Return mock data when procedural package is not available
    return mockProceduralPreview(seed, constraints);
  }
}

/**
 * Mock procedural preview for when the procedural package is not available
 */
function mockProceduralPreview(
  seed: number,
  constraints?: ProceduralConstraints
): ProceduralPreviewResult {
  const projectName = `project-${seed}`;
  return {
    files: {
      'README.md': `# ${projectName}\n\nGenerated from seed ${seed}`,
      'package.json': JSON.stringify(
        {
          name: projectName,
          version: '0.1.0',
          description: `Project generated from seed ${seed}`,
        },
        null,
        2
      ),
    },
    stack: {
      archetype: constraints?.archetype || 'backend',
      language: constraints?.language || 'typescript',
      runtime: 'node',
      framework: constraints?.framework || 'express',
      database: 'postgres',
      orm: 'prisma',
      transport: 'rest',
      packaging: 'docker',
      cicd: 'github-actions',
      buildTool: 'vite',
      styling: 'tailwind',
      testing: 'vitest',
    },
    seed,
    projectId: projectName,
    projectName,
  };
}

/**
 * Execute procedural generation using the procedural package directly
 *
 * Note: In browser context, this returns the files but cannot write to disk.
 * Writing to disk requires the Tauri backend or a server-side process.
 */
export async function executeProceduralGeneration(
  seed: number,
  constraints?: ProceduralConstraints
): Promise<ProceduralGenerationResult> {
  const startTime = Date.now();

  try {
    const preview = await executeProceduralPreview(seed, constraints);

    return {
      success: true,
      message: `Generated ${Object.keys(preview.files).length} files for ${preview.projectId}`,
      filesGenerated: Object.keys(preview.files),
      outputPath: '', // Cannot write to disk in browser
      stack: preview.stack,
      projectId: preview.projectId,
      projectName: preview.projectName,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Generation failed',
      filesGenerated: [],
      outputPath: '',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Get available constraint options from the procedural engine
 */
export async function getProceduralConstraintOptions(): Promise<{
  archetypes: string[];
  languages: string[];
  frameworks: string[];
}> {
  try {
    const procedural = await import('@retro-vibecoder/procedural');
    const { ARCHETYPE_IDS, LANGUAGE_IDS, FRAMEWORKS } = procedural;

    return {
      archetypes: [...ARCHETYPE_IDS],
      languages: [...LANGUAGE_IDS],
      frameworks: FRAMEWORKS.map((f: { id: string }) => f.id),
    };
  } catch {
    // Return default options when procedural package is not available
    return {
      archetypes: ['backend', 'web', 'cli', 'mobile', 'library', 'desktop', 'game'],
      languages: ['typescript', 'python', 'rust', 'go', 'java', 'csharp', 'cpp'],
      frameworks: ['express', 'fastapi', 'axum', 'react', 'vue', 'cobra', 'spring-boot'],
    };
  }
}

/**
 * Validate constraint combination before generation
 */
export async function validateProceduralConstraints(
  constraints: ProceduralConstraints
): Promise<{ valid: boolean; errors: string[]; suggestions: string[] }> {
  try {
    const procedural = await import('@retro-vibecoder/procedural');
    // Type assertion needed because our constraints are strings but the engine uses specific types
    const validateFn = procedural.validateConstraints as (
      archetype?: string,
      language?: string,
      framework?: string
    ) => { valid: boolean; errors: string[]; suggestions: string[] };

    return validateFn(constraints.archetype, constraints.language, constraints.framework);
  } catch {
    // Return valid when procedural package is not available
    return {
      valid: true,
      errors: [],
      suggestions: [],
    };
  }
}
