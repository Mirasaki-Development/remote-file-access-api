import { NextFunction, Request, Response } from 'express';

export const UNAUTHORIZED_ERROR = 'UNAUTHORIZED';
export const RESOURCE_NOT_FOUND_ERROR = 'RESOURCE_NOT_FOUND';
export const PAGE_NOT_FOUND_ERROR = 'PAGE_NOT_FOUND_ERROR';
export const TOO_MANY_REQUESTS_ERROR = 'TOO_MANY_REQUESTS';
export const UNEXPECTED_ERROR_ENCOUNTERED_ERROR = 'UNEXPECTED_ERROR_ENCOUNTERED';

/**
 * Represents an error response that can be returned from our API
 */
export class ApiError {
  ok: boolean;
  code: number;
  error: string;
  message: string;
  body?: object;
  constructor (
    code: number,
    error: string,
    message: string,
    body?: object
  ) {
    this.ok = false;
    this.code = code;
    this.error = error;
    this.message = message;
    this.body = body ?? {};
  }
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  message: string;
  // Allow error response body to be expanded
  [key: string]: unknown;
}

/**
 * This apiErrorHandler function
 * be the only place in our application where we
 * define the { error: ... } field to utilize our
 * error handler - notice there is no `next` function,
 * as all requests should stop once an error is determined
 */
export const apiErrorHandler = (
  err: Error, 
  req: Request, 
  res: Response,
  // Has to be defined
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Expected errors
  if (err instanceof ApiError) {
    const body = {
      ok: false,
      error: err.message,
      message: err.message,
      ...err.body
    };
    res.status(err.code).json(body);
    return;
  }

  // Unexpected Errors, we should really handle these
  if (process.env.NODE_ENV !== 'production') {
    console.error('500 - Internal Server Error encountered:');
    console.error(err);
  }

  // Unexpected errors
  res.status(500).json({
    ok: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong on our side, please try again later. This issue has been logged to the developers.'
      : `[in-dev] Error: ${ err.stack ?? err.message ?? err }`
  });
};

export const unauthorized = () => new ApiError(
  401,
  UNAUTHORIZED_ERROR,
  'Invalid X-API-Key header provided - please authenticate'
);

export const resourceNotFound = (resourceId: string) => new ApiError(
  404,
  RESOURCE_NOT_FOUND_ERROR,
  `Specified resource ${resourceId} doesn't exist`
);

export const pageNotFound = (req: Request) => new ApiError(
  404,
  PAGE_NOT_FOUND_ERROR,
  `The requested page at "${ req.originalUrl }" doesn't exist`
);

export const tooManyRequestsError = (rlHeaders: object) => new ApiError(
  429,
  TOO_MANY_REQUESTS_ERROR,
  'Too many requests',
  rlHeaders
);

