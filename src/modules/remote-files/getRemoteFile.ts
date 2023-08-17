import { RemoteFileAccess } from '../../../config/internal/types';
import { findNewestFile, getLatestLines } from '../files';
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
  const normalizedPath = path.normalize(cfg.FILE_NAME
    ? `${cfg.DIRECTORY}/${cfg.FILE_NAME}`
    : `${await findNewestFile(cfg.DIRECTORY)}`
  );
  if (normalizedPath.endsWith('null')) return null;
  return await getLatestLines(normalizedPath, { linesToRetrieve: cfg.USE_LATEST_LINES });
};
