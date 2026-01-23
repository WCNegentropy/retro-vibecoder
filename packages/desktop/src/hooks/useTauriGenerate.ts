import { useState, useCallback } from 'react';
import type { GenerationRequest, GenerationResult, PreviewResult } from '../types';

/**
 * Check if running in Tauri environment
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Mock implementation for development outside Tauri
 */
async function mockGenerate(request: GenerationRequest): Promise<GenerationResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    message: `Mock generation for seed ${request.seed} completed`,
    files_generated: ['package.json', 'tsconfig.json', 'src/index.ts', '.gitignore', 'README.md'],
    output_path: request.output_path,
    duration_ms: 150,
  };
}

/**
 * Mock preview for development outside Tauri
 */
async function mockPreview(request: GenerationRequest): Promise<PreviewResult> {
  await new Promise(resolve => setTimeout(resolve, 300));

  // Generate deterministic mock based on seed
  const seed = request.seed || 0;
  const archetypes = ['backend', 'web', 'cli', 'mobile', 'library'];
  const languages = ['typescript', 'python', 'rust', 'go', 'java'];
  const frameworks = ['express', 'fastapi', 'axum', 'gin', 'spring-boot'];

  return {
    files: {
      'package.json': '{ "name": "generated-project" }',
      'src/index.ts': '// Entry point',
      'README.md': '# Generated Project',
    },
    stack: {
      archetype: archetypes[seed % archetypes.length] as 'backend',
      language: languages[seed % languages.length] as 'typescript',
      runtime: 'node',
      framework: frameworks[seed % frameworks.length],
      database: seed % 2 === 0 ? 'postgres' : 'none',
      orm: 'none',
      transport: 'rest',
      packaging: seed % 3 === 0 ? 'docker' : 'none',
      cicd: 'github-actions',
      buildTool: 'vite',
      styling: 'none',
      testing: 'vitest',
    },
    seed: request.seed,
  };
}

/**
 * Hook for interacting with Tauri generation commands
 *
 * Provides:
 * - generate: Generate a project to disk
 * - preview: Preview generation without writing files
 * - isLoading: Loading state
 * - error: Error message if any
 * - result: Last generation result
 */
export function useTauriGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const generate = useCallback(
    async (request: GenerationRequest): Promise<GenerationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        let generationResult: GenerationResult;

        if (isTauri()) {
          // Use Tauri invoke
          const { invoke } = await import('@tauri-apps/api/core');
          generationResult = await invoke<GenerationResult>('generate_project', { request });
        } else {
          // Use mock implementation
          generationResult = await mockGenerate(request);
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
      let previewResult: PreviewResult;

      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        previewResult = await invoke<PreviewResult>('preview_generation', { request });
      } else {
        previewResult = await mockPreview(request);
      }

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
  };
}
