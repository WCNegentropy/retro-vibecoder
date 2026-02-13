/**
 * Shared manifest path resolution utility
 *
 * Resolves a user-supplied path (file or directory) to a manifest file path.
 * If the path is a directory, it searches for known manifest filenames within it.
 */

import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { MANIFEST_FILENAMES } from '@wcnegentropy/shared';

/**
 * Find a manifest file in a directory by checking known filenames.
 */
async function findManifestFile(dirPath: string): Promise<string | null> {
  for (const filename of MANIFEST_FILENAMES) {
    const filePath = resolve(dirPath, filename);
    try {
      await readFile(filePath);
      return filePath;
    } catch {
      // File doesn't exist, try next
    }
  }
  return null;
}

/**
 * Resolve a user-supplied path to an actual manifest file path.
 *
 * If the path points to a directory, searches for known manifest filenames
 * (upg.yaml, upg.yml, .upg.yaml, .upg.yml) inside it.
 *
 * @param inputPath - File or directory path provided by the user
 * @returns The resolved absolute path to the manifest file
 * @throws If the path is a directory and no manifest file is found
 */
export async function resolveManifestPath(inputPath: string): Promise<string> {
  let filePath = resolve(inputPath);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      const found = await findManifestFile(filePath);
      if (!found) {
        throw new Error(
          `No manifest file found in directory. Expected one of: ${MANIFEST_FILENAMES.join(', ')}`
        );
      }
      filePath = found;
    }
  } catch (error) {
    // Re-throw our own error (no manifest found)
    if ((error as Error).message?.startsWith('No manifest file found')) {
      throw error;
    }
    // For ENOENT, let the caller handle the missing file
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Return the original path; caller will get the error on readFile
      return filePath;
    }
    throw error;
  }

  return filePath;
}
