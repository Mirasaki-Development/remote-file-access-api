import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { unauthorized } from './api-errors';

export const X_API_KEY = 'x-api-key';

export const requireAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKeyHeader = req.headers[X_API_KEY];
  if (!apiKeyHeader || apiKeyHeader !== config.API_KEY) next(unauthorized);
  else next();
};
