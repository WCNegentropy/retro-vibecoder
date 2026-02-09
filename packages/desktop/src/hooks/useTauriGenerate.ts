import { useState, useCallback } from 'react';
import type { GenerationRequest, GenerationResult, PreviewResult } from '../types';

// ============================================================================
// Tauri Environment Helpers
// ============================================================================

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Error thrown when Tauri environment is not available
 */
class TauriNotAvailableError extends Error {
  constructor() {
    super(
      'Tauri environment not available. ' +
        'This application requires the Tauri desktop runtime to function. ' +
        'Please run this application through the desktop app, not a web browser.'
    );
    this.name = 'TauriNotAvailableError';
  }
}

// ============================================================================
// Sidecar Types & Execution
// ============================================================================

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
 * Execute a sidecar binary via Tauri
 *
 * This uses the Tauri shell plugin to spawn the bundled sidecar binary.
 * The sidecar must be configured in tauri.conf.json.
 *
 * Note: In v1, the primary sidecar is the upg CLI for procedural generation.
 */
export async function executeSidecar(
  config: SidecarConfig,
  onEvent?: (event: SidecarEvent) => void
): Promise<SidecarResult> {
  const startTime = Date.now();

  if (!isTauri()) {
    throw new Error(
      'Sidecar execution requires Tauri environment. ' +
        'Please run this application through the desktop app.'
    );
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
 * Validate a UPG manifest using the core package
 *
 * This doesn't use a sidecar - it invokes the Tauri command
 * which calls the Rust validation logic.
 *
 * Note: Requires Tauri environment - no mock fallback.
 */
export async function validateManifest(manifestPath: string): Promise<{
  valid: boolean;
  errors: Array<{ message: string; path: string }>;
  warnings: Array<{ message: string; path: string }>;
}> {
  if (!isTauri()) {
    throw new Error(
      'Manifest validation requires Tauri environment. ' +
        'Please run this application through the desktop app.'
    );
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

/**
 * Hook for interacting with Tauri generation commands
 *
 * IMPORTANT: This hook requires the Tauri runtime environment.
 * When not running in Tauri, operations will fail with a clear error.
 *
 * Provides:
 * - generate: Generate a project to disk
 * - preview: Preview generation without writing files
 * - isLoading: Loading state
 * - error: Error message if any
 * - result: Last generation result
 * - isTauriAvailable: Whether Tauri runtime is available
 */
export function useTauriGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  /**
   * Check if Tauri is available (useful for conditional UI rendering)
   */
  const isTauriAvailable = isTauri();

  const generate = useCallback(
    async (request: GenerationRequest): Promise<GenerationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Fail explicitly if not in Tauri environment
        if (!isTauri()) {
          throw new TauriNotAvailableError();
        }

        // Use Tauri invoke for real generation
        const { invoke } = await import('@tauri-apps/api/core');
        const generationResult = await invoke<GenerationResult>('generate_project', { request });

        // Check if the backend returned an error
        if (!generationResult.success) {
          setError(generationResult.message);
          setResult(generationResult);
          return generationResult;
        }

        setResult(generationResult);
        return generationResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const preview = useCallback(async (request: GenerationRequest): Promise<PreviewResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fail explicitly if not in Tauri environment
      if (!isTauri()) {
        throw new TauriNotAvailableError();
      }

      // Use Tauri invoke for real preview
      const { invoke } = await import('@tauri-apps/api/core');
      const previewResult = await invoke<PreviewResult>('preview_generation', { request });

      return previewResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Preview failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    preview,
    isLoading,
    error,
    result,
    isTauriAvailable,
  };
}
