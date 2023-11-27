import { readdirSync, statSync } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { debugLog } from '../debug';

export interface LatestLinesOptions {
  linesToRetrieve?: number;
}

export const getLatestLines = async (
  filePath: string,
  options: LatestLinesOptions = {}
): Promise<string[]> => {
  const { linesToRetrieve = 500 } = options;
  const contents = await readFile(filePath, { encoding: 'utf8' });
  return contents.split('\n')
    .slice(-linesToRetrieve)
    .reverse();
};

export const getRawFileContents = async (
  filePath: string
): Promise<string> => await readFile(filePath, { encoding: 'utf8' });

export const findNewestFile = async (
  directoryPath: string,
  skipN = 0,
  extension?: string | null
): Promise<string | null> => {
  try {
    const files = await readdir(directoryPath);
    if (files.length === 0) return null;

    // Sort files by creation time (ctimeMs) in descending order
    let sortedFiles = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const fileStat = await stat(filePath);
        return { filePath, ctimeMs: fileStat.ctimeMs };
      })
    );

    // Can't continue
    if (!sortedFiles) return null;

    // Resolve workable files
    sortedFiles = sortedFiles
      // Filter whitelisted files
      .filter((e) => typeof extension === 'undefined' || e.filePath.endsWith(extension))
      // Sort by creation date
      .sort((a, b) => b.ctimeMs - a.ctimeMs);

    // If there are fewer files than skipN, return null
    if (sortedFiles.length <= skipN) return null;

    // Return the path of the (skipN + 1)-th newest file
    debugLog(`Found ${sortedFiles.length} files in ${directoryPath}, returning ${
      sortedFiles[skipN].filePath
    } as the ${skipN + 1}-th newest file${extension ? ` with extension ${extension}` : ''}`);
    return sortedFiles[skipN].filePath;
  } catch (error) {
    throw new Error(`Error finding newest file: ${error.message}`);
  }
};

/**
 * Get an array of (resolved) absolute file paths in the target directory,
 * Ignores files that start with a "." character
 */
export const getFiles = (
  requestedPath: string,
  allowedExtensions: string[] = [
    '.js',
    '.mjs',
    '.cjs'
  ]) => {
  if (typeof allowedExtensions === 'string') allowedExtensions = [ allowedExtensions ];

  let res = [];
  for (let itemInDir of readdirSync(requestedPath)) {
    itemInDir = path.resolve(requestedPath, itemInDir);
    const stat = statSync(itemInDir);

    if (stat.isDirectory()) res = res.concat(getFiles(itemInDir, allowedExtensions));
    if (
      stat.isFile()
      && allowedExtensions.find((ext) => itemInDir.endsWith(ext))
      && !itemInDir.slice(
        itemInDir.lastIndexOf(path.sep) + 1, itemInDir.length
      ).startsWith('.')
    ) res.push(itemInDir);
  }

  debugLog(`Resolved files for ${requestedPath}:`, res);
  return res;
};