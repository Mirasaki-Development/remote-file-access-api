import { NextFunction, Request, Response } from 'express';
import { deleteJSONFile, getAllJSONFiles, getJSONFile, putJSONFile } from './helper';
import { resourceNotFound } from '../api-errors';
import config from '../../config';

export const getAllJSONDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_JSON_DATABASES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`JSON_DATABASE-${name}`));
    return;
  }

  // Resolve data
  const allJSONData = getAllJSONFiles(cfg.DIRECTORY);

  // Don't handle error (empty),
  // provide empty array for null fallback

  // Send the response, yay!
  res.json({ data: allJSONData ?? [] });
};

export const getJSONDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_JSON_DATABASES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`JSON_DATABASE-${name}`));
    return;
  }

  // Resolve data
  const { identifier } = req.params;
  const jsonData = getJSONFile(cfg.DIRECTORY, identifier);

  // Handle errors
  if (jsonData === null) {
    next(resourceNotFound(`JSON_DATABASE(${name})-${identifier}`));
    return;
  }

  // Ok, send the response
  res.json({ data: jsonData });
};

export const deleteJsonDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_JSON_DATABASES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`JSON_DATABASE-${name}`));
    return;
  }

  // Resolve data
  const { identifier } = req.params;
  const jsonData = getJSONFile(cfg.DIRECTORY, identifier);

  // Handle errors
  if (jsonData === null) {
    next(resourceNotFound(`JSON_DATABASE(${name})-${identifier}`));
    return;
  }

  // Delete the file/data
  deleteJSONFile(cfg.DIRECTORY, identifier);

  // Ok, send the response
  res.json({ data: jsonData });
};

export const putJSONDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_JSON_DATABASES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`JSON_DATABASE-${name}`));
    return;
  }

  // Resolve data
  const { identifier } = req.params;
  const newJSONContent = req.body;
  const response = putJSONFile(cfg.DIRECTORY, identifier, newJSONContent);

  // Handle errors - target to overwrite doesn't exist
  if (response === null) {
    next(resourceNotFound(`JSON_DATABASE(${name})-${identifier}`));
    return;
  }

  // Ok, send the response
  res.json({ data: newJSONContent });
};

export const patchJSONDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Make sure we have a config to work with
  const { name } = req.params;
  const cfg = config.REMOTE_JSON_DATABASES.find((e) => e.NAME === name);
  if (!cfg) {
    next(resourceNotFound(`JSON_DATABASE-${name}`));
    return;
  }

  // Resolve data
  const { identifier } = req.params;
  const updatedJSONFields = req.body;
  const jsonData = getJSONFile(cfg.DIRECTORY, identifier);
  if (!jsonData) {
    next(resourceNotFound(`JSON_DATABASE(${name})-${identifier}`));
    return;
  }

  // Update/Overwrite all individual keys
  for (const [key, val] of Object.entries(updatedJSONFields)) {
    jsonData[key] = val;
  }

  // Reflect in file - can't 404
  putJSONFile(cfg.DIRECTORY, identifier, jsonData);

  // Ok, send the response
  res.json({ data: jsonData });
};
