import { NextFunction, Request, Response } from 'express';
import appConfig from '../resources/config';
import { ResourceParser } from '../resources/parser';
import { APIError, APIErrorCode } from './api-errors';

class Authentication {
  public static readonly X_API_KEY = 'x-api-key';

  public static readonly requireMasterAPIKey = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const apiKeyHeader = req.headers[Authentication.X_API_KEY];

    if (!apiKeyHeader) {
      next(new APIError({
        code: APIErrorCode.UNAUTHORIZED,
        message: 'API key is missing',
        status: 401,
        details: {
          [Authentication.X_API_KEY]: req.headers[Authentication.X_API_KEY],
        },
      }));
      return;
    }

    if (apiKeyHeader !== appConfig['master-api-key']) {
      next(new APIError({
        code: APIErrorCode.FORBIDDEN,
        message: 'Invalid API key',
        status: 403,
        details: {
          [Authentication.X_API_KEY]: req.headers[Authentication.X_API_KEY],
        },
      }));
      return;
    }

    next();
  };

  public static readonly requireAuthorization = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { slug } = req.params;
    const { query } = req;

    const parser = await ResourceParser.getInstance();
    const resource = parser.filters.bySlug(slug);
    
    if (!resource) {
      next(new APIError({
        code: APIErrorCode.NOT_FOUND,
        message: 'Resource not found',
        status: 404,
        details: {
          slug,
          query,
        },
      }));
      return;
    }
        
    if (resource.permissions === null || !resource.permissions.length) {
      this.requireMasterAPIKey(req, res, next);
      return;
    }

    const action = req.method === 'GET'
      ? 'read'
      : req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT'
        ? 'write'
        : req.method === 'DELETE'
          ? 'delete'
          : 'execute';

    const apiKeyHeader = req.headers[Authentication.X_API_KEY];
    const permissions = resource.permissions.filter((permission) => {
      if (permission.type === 'all') {
        return true;
      }

      if (Array.isArray(permission.type)) {
        return permission.type.includes(action);
      }

      return permission.type === action;
    });
    const isAuthorized = permissions.some((permission) => permission['api-key'] === apiKeyHeader);

    if (!permissions.length) {
      next(new APIError({
        code: APIErrorCode.FORBIDDEN,
        message: 'Action not allowed',
        status: 403,
        details: {
          action,
          status: 'prohibited',
          [Authentication.X_API_KEY]: req.headers[Authentication.X_API_KEY],
        },
      }));
      return;
    }

    if (!isAuthorized) {
      next(new APIError({
        code: APIErrorCode.FORBIDDEN,
        message: `Not authorized to perform action "${action}" on this resource, using the provided API key`,
        status: 403,
        details: {
          action,
          status: 'prohibited',
          [Authentication.X_API_KEY]: req.headers[Authentication.X_API_KEY],
        },
      }));
      return;
    }

    next();
  };
}

export { Authentication };
