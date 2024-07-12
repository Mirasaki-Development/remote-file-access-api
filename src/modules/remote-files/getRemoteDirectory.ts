import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import { resourceNotFound } from '../api-errors';
import { readdirSync, createReadStream } from 'fs';
import archiver from 'archiver'; // Import archiver for creating zip files
import { debugLog } from '../../debug';
import { join } from 'path';

export const getRemoteDirectoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_DIRECTORIES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`REMOTE_DIRECTORY_CFG-${name}`));
    return;
  }

  // The dir path to get all files from
  const dirPath = cfg.DIRECTORY;

  // If not null or empty array, only allows these whitelisted string[] file extensions
  const allowedExtensions = cfg.EXTENSIONS;

  debugLog(`Attempting to stream remote directory ${name} from ${dirPath}`);
  try {
    // Set appropriate header
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.zip"`);

    // Create a zip archive and pipe it to the response
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Recursively process all files, and finalize after
    await compressAndAddFilesToArchive(archive, dirPath, allowedExtensions);
    archive.finalize();
  } catch (error) {
    // Handle any errors that occur during file reading or processing
    next(error); // Pass the error to the error handling middleware
  }
};

export const compressAndAddFilesToArchive = async (
  archive: archiver.Archiver,
  dirPath: string,
  allowedExtensions: string[] | null
) => {
  const processDirectory = async (directoryPath: string) => {
    const items = readdirSync(directoryPath, { withFileTypes: true })
      .filter((file) =>
        allowedExtensions && allowedExtensions[0]
          ? allowedExtensions.includes(file.name.split('.').pop())
          : true
      );

    debugLog(`Found ${items.length} items in ${directoryPath} to archive`);
    for (const item of items) {
      const itemPath = join(directoryPath, item.name);
      if (item.isDirectory()) {
        debugLog(`Adding directory ${itemPath} to zip archive`);
        await processDirectory(itemPath); // Recursively process subdirectories
      } else if (item.isFile()) {
        debugLog(`Adding file ${itemPath} to zip archive`);
        archive.append(createReadStream(itemPath), { name: item.name }); // Add file to the zip archive
      }
    }
  };

  await processDirectory(dirPath);
};
