import { id } from 'cls-rtracer';
import { NextFunction, Request, Response } from 'express';
import { debugLog } from '../debug';

/** Assign every request a unique id */
export const setRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.locals.rid = id();
  next();
  debugLog('Assigned Request ID:', res.locals.rid);
};

/** Transform our `res#json` function and include persistent properties */
export const transformJSONResponse = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Save original res.json function
  const originalJson = res.json;

  // Replace res.json with a new function that includes the request ID
  res.json = function (body) {
    // Constructing the final response body
    const responseBody = {
      // Apply our request id
      rid: res.locals.rid,
      // Only set 'ok' if omitted, true
      ok: 'ok' in body ? body.okay : true,
      // Spread our transformed body response
      ...body
    };

    // Invoke original #json() function
    return originalJson.call(this, responseBody);
  };

  // Continue ^^/
  next();
};