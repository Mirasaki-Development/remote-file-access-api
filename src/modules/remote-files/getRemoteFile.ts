import { RemoteFileAccess } from '../../../config/internal/types';
import { findNewestFile, getLatestLines, getRawFileContents } from '../files';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import config from '../../config';
import { resourceNotFound } from '../api-errors';

export const getRemoteFileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_FILES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`REMOTE_FILE_CFG-${name}`));
    return;
  }

  // Send the contents
  const fileContents = await getRemoteAccessContent(cfg);
  res.json({ data: fileContents });
};

/**
 * Get remote file contents, config paths have been validated
 * before this function is reached
 */
export const getRemoteAccessContent = async (cfg: RemoteFileAccess) => {
  // Declarations
  const res = [];
  let useLatestFiles = 1;
  if (cfg.USE_LATEST_FILES && cfg.USE_LATEST_FILES >= 1) useLatestFiles = cfg.USE_LATEST_FILES;


  for (let i = 0; i < useLatestFiles; i++) {
    // Resolve latest files
    const latestFile = await findNewestFile(cfg.DIRECTORY, i);
    if (latestFile === null) break;

    // Resolve workable path
    const normalizedPath = path.normalize(cfg.FILE_NAME
      ? `${cfg.DIRECTORY}/${cfg.FILE_NAME}`
      : `${latestFile}`
    );

    // Check how data should be returned
    if (cfg.SPLIT === false) res.push(await getRawFileContents(normalizedPath));
    else res.push(await getLatestLines(normalizedPath, { linesToRetrieve: cfg.USE_LATEST_LINES }));
  }

  // Flatten array based on configuration
  return res.flat(
    cfg.JOIN_LATEST_FILES === false
      ? 0
      : 1
  );
};
