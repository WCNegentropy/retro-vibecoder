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
// Validation & Output Helpers
// ============================================================================

/**
 * Validate a UPG manifest using the Tauri backend command
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
 * Format output for display
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
