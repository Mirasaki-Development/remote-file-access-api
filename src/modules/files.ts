import { readdirSync, statSync } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';

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
  skipN = 0
): Promise<string | null> => {
  try {
    const files = await readdir(directoryPath);
    if (files.length === 0) return null;

    // Sort files by creation time (ctimeMs) in descending order
    const sortedFiles = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const fileStat = await stat(filePath);
        return { filePath, ctimeMs: fileStat.ctimeMs };
      })
    );

    // Sort by creation date
    sortedFiles.sort((a, b) => b.ctimeMs - a.ctimeMs);

    // If there are fewer files than skipN, return null
    if (sortedFiles.length <= skipN) return null;

    // Return the path of the (skipN + 1)-th newest file
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
  return res;
};