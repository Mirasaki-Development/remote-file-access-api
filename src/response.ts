import type { Response } from 'express';
import { APIError } from './modules/api-errors';

type TypedResponseData = APIError | {
  data: NonNullable<unknown>;
};

export const typedResponse = <T extends TypedResponseData>(
  res: Response,
  data: T,
  statusCode?: number,
): Response<T> => {
  const isApiError = data instanceof APIError;
  res.status(statusCode ?? (isApiError ? data.status : 200));

  return res.json(isApiError ? data.toJSON() : data);
};
