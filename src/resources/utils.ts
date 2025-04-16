import { constants } from 'fs';
import { access, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import { logger } from '../logger';
import { ResponseType, responseTypes } from './schema';

interface ResourceMeta {
  filePath: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  lastModified?: Date;
  createdAt?: Date;
  mimeType?: string;
  encoding?: string;
  [key: string]: unknown;
}

class ResourceUtils {
  /**
   * Check if a file exists at the given path. Note that this should not be used when
   * trying to serve a resource, as quoted by the native Node.js documentation:
   *
   * "Using `fsPromises.access()` to check for the accessibility of a file before calling `fsPromises.open()` is not recommended.
   * Doing so introduces a race condition, since other processes may change the file's state between the two calls.
   * Instead, user code should open/read/write the file directly and handle the error raised if the file is not accessible."
   */
  static async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch (error) {
      logger.debug(`File does not exist: ${filePath}`, error);
      return false;
    }
  }

  static resolveResponseType(
    input?: string,
    defaultType: ResponseType = 'stream',
  ): ResponseType {
    if (responseTypes.includes(input as ResponseType)) {
      return input as ResponseType;
    }

    const mimeType = input ? ResourceUtils.getMimeType(input) : null;

    if (mimeType) {
      return mimeType as ResponseType;
    }

    const ext = input ? ResourceUtils.getFileExtension(input) : null;

    if (ext && responseTypes.includes(ext as ResponseType)) {
      return ext as ResponseType;
    }

    return defaultType;
  }

  /**
   * Get the file extension of a file.
   */
  static getFileExtension(filePath: string): string {
    const ext = path.extname(filePath);
    return ext ? ext.slice(1) : '';
  }

  /**
   * Get the MIME type of a file based on its extension.
   * If the extension is not recognized, return null.
   *
   * Please note this only includes MIME types for our supported
   * (response) formats.
   */
  static getMimeType(filePath: string): string | null {
    const ext = ResourceUtils.getFileExtension(filePath);
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      text: 'text/plain',
      csv: 'text/csv',
      yaml: 'application/x-yaml',
      toml: 'application/toml',
    };
    return mimeTypes[ext] || null;
  }

  /**
   * Check if a directory exists at the given path.
   */
  static async isDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      return stats.isDirectory();
    } catch (error) {
      logger.debug(`Path is not a directory: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Check if a directory contains files with the specified extensions.
   * - If `recursive` is true, it will check all subdirectories as well.
   * - If `extensionWhitelist` is empty, it will return true if any files are found.
   */
  static async hasFiles(
    directoryPath: string,
    recursive = false,
    extensionWhitelist: string[] = [],
  ): Promise<boolean> {
    try {
      const entries = await readdir(directoryPath);

      const filteredFiles = extensionWhitelist.length
        ? entries.filter((file) => extensionWhitelist.some((ext) => file.endsWith(ext)))
        : entries;

      if (filteredFiles.length > 0) {
        return true;
      }

      if (!recursive) {
        return false;
      }

      const subDirs = filteredFiles.map((entry) => path.join(directoryPath, entry));
      const results = await Promise.all(
        subDirs.map((dir) => ResourceUtils.hasFiles(dir, true, extensionWhitelist)),
      );

      return results.some(Boolean);
    } catch {
      return false;
    }
  }

  /**
   * List all files in a directory with the specified extensions.
   * - If `recursive` is true, it will list all files in subdirectories as well.
   * - If `extensionWhitelist` is empty, it will list all files.
   */
  static async listFiles(
    directoryPath: string,
    recursive = false,
    extensionWhitelist: string[] = [],
  ): Promise<string[]> {
    try {
      const entries = await readdir(directoryPath);
      const filePaths = entries.map((file) => path.join(directoryPath, file));
      const results = await Promise.all(
        filePaths.map(async (filePath) => {
          const isDir = await ResourceUtils.isDirectory(filePath);

          if (isDir && recursive) {
            return await ResourceUtils.listFiles(filePath, true, extensionWhitelist);
          }

          if (isDir) {
            return [filePath];
          }

          if (extensionWhitelist.length && !extensionWhitelist.some((ext) => filePath.endsWith(ext))) {
            return [];
          }

          return [filePath];
        }),
      );

      return results.flat();
    } catch (error) {
      logger.debug(`Error listing files in directory: ${directoryPath}`, error);
      return [];
    }
  }

  static async readFile(filePath: string): Promise<{ data: string; meta: ResourceMeta }> {
    try {
      const fileExists = await ResourceUtils.checkFileExists(filePath);
      if (!fileExists) {
        throw new Error(`File not found: ${filePath}`);
      }

      const [data, stats] = await Promise.all([
        readFile(filePath, 'utf-8'),
        stat(filePath),
      ]);

      return {
        data,
        meta: {
          filePath,
          fileName: path.basename(filePath),
          fileSize: stats.size,
          fileType: ResourceUtils.getFileExtension(filePath),
          lastModified: stats.mtime,
          createdAt: stats.birthtime,
          mimeType: 'application/octet-stream', // Default MIME type, can be improved
          encoding: 'utf-8', // Default encoding, can be improved
        },
      };
    } catch (error) {
      logger.debug(`Error reading file: ${filePath}`, error);
      throw error;
    }
  }

  static readonly resolveEncoding = (encoding: unknown, defaultValue: BufferEncoding = 'utf-8'): BufferEncoding => {
    if (
      encoding === null
      || encoding === undefined
      || typeof encoding !== 'string'
    ) {
      return defaultValue;
    }

    const validEncodings: BufferEncoding[] = [
      'utf-8',
      'ascii',
      'utf8',
      'utf16le',
      'utf-16le',
      'ucs2',
      'ucs-2',
      'base64',
      'base64url',
      'latin1',
      'binary',
      'hex',
    ];

    if (validEncodings.includes(encoding as BufferEncoding)) {
      return encoding as BufferEncoding;
    }

    return defaultValue;
  };

  static async writeFile(
    filePath: string,
    data: string,
    options: { encoding?: BufferEncoding | null | undefined } = {},
  ): Promise<void> {
    try {
      const { encoding = 'utf-8' } = options;
      await writeFile(filePath, data, { encoding });
    } catch (error) {
      logger.debug(`Error writing file: ${filePath}`, error);
      throw error;
    }
  }

  static async deleteTarget(
    filePath: string,
    type: 'file' | 'directory',
  ): Promise<void> {
    try {
      await rm(filePath, { force: true, recursive: type === 'directory' });
    } catch (error) {
      logger.debug(`Error deleting file: ${filePath}`, error);
      throw error;
    }
  }
}

export { ResourceUtils, type ResourceMeta };
