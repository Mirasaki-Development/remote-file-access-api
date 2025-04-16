import { spawn } from 'child_process';
import { createHash } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Logger } from '../logger';
import { APIError, APIErrorCode } from '../modules/api-errors';
import { typedResponse } from '../response';
import { ParsedResource, ResourceParser } from './parser';
import { CacheControlPolicy } from './schema';
import { ResourceUtils } from './utils';

const hashAny = (data: unknown): string => createHash('sha256').update(JSON.stringify(data)).digest('hex');

class ResourceHandler {
  private static instance: ResourceHandler | null = null;
  public static async getInstance(): Promise<ResourceHandler> {
    if (!this.instance) {
      this.instance = new ResourceHandler(await ResourceParser.getInstance());
    }
    return this.instance;
  }

  private constructor(
    public readonly parser: ResourceParser,
  ) {}

  static buildCacheControlHeader(cacheControlPolicy: CacheControlPolicy | null): string {
    const directives: string[] = [];
  
    if (!cacheControlPolicy) {
      return 'no-store';
    }
  
    if (cacheControlPolicy['max-age']) {
      directives.push(`max-age=${cacheControlPolicy['max-age']}`);
    }
  
    if (cacheControlPolicy['s-maxage']) {
      directives.push(`s-maxage=${cacheControlPolicy['s-maxage']}`);
    }
  
    if (cacheControlPolicy['no-cache']) {
      directives.push('no-cache');
    }
  
    if (cacheControlPolicy['no-store']) {
      directives.push('no-store');
    }

    if (cacheControlPolicy['stale-while-revalidate']) {
      directives.push(`stale-while-revalidate=${cacheControlPolicy['stale-while-revalidate']}`);
    }

    if (cacheControlPolicy['stale-if-error']) {
      directives.push(`stale-if-error=${cacheControlPolicy['stale-if-error']}`);
    }
  
    if (cacheControlPolicy.public) {
      directives.push('public');
    }
  
    if (cacheControlPolicy.private) {
      directives.push('private');
    }
  
    if (cacheControlPolicy.immutable) {
      directives.push('immutable');
    }
  
    return directives.length > 0 ? directives.join(', ') : 'no-store';
  }

  private static async streamFileResource(
    pathToResource: string,
    resource: ParsedResource,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const filePath = pathToResource;
    const filename = path.basename(filePath);
    const fileStat = await stat(filePath);
    const fileStream = createReadStream(filePath);

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fileStat.size);

    fileStream.pipe(res);
    fileStream.on('error', (err) => {
      Logger.error('Error streaming file:', err);
      next(new APIError({
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Error streaming file',
        status: 500,
        details: {
          slug: resource.slug,
          query: req.query,
          error: err.message,
        },
      }));
    });
  }

  private static async getResourceFile(
    resource: ParsedResource,
    query: {
      cursor: string | null;
    },
  ): Promise<string> {
    if (resource.type === 'file') {
      if (!resource.extensions || !resource.extensions.length) {
        return resource.target;
      }

      const promises = resource.extensions.map(async (ext) => {
        const filePath = `${resource.target}.${ext}`;
        const fileExists = await ResourceUtils.checkFileExists(filePath);
        if (fileExists) {
          return filePath;
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validResult = results.find((result) => result !== null);

      if (!validResult) {
        throw new APIError({
          code: APIErrorCode.NOT_FOUND,
          message: 'File not found',
          status: 404,
          details: {
            slug: resource.slug,
            query,
          },
        });
      }

      return validResult;
    }

    throw new Error('Directory resources are not supported through this method, use "listFiles" instead.');
  }

  private readonly handleGetRequest = async (
    resource: ParsedResource,
    query: {
      recursive: boolean;
      currentLocation: string;
      type: string | null;
    },
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { currentLocation, recursive, type: responseType } = query;
    const stats = await stat(currentLocation);
    const currentIsFile = stats.isFile();
    const directoryResourceIsInFile = resource.type === 'directory' && currentIsFile;

    Logger.debug(`[GET] Resource found: ${resource.slug}`, resource, {
      query,
      recursive,
      responseType,
      currentLocation,
      currentIsFile,
      ...stats,
    });

    if (resource.type === 'file' || directoryResourceIsInFile) {
      const cacheControlPolicy = resource['cache-control'];

      if (cacheControlPolicy) {
        res.setHeader('Cache-Control', ResourceHandler.buildCacheControlHeader(cacheControlPolicy));
      }

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Range', `bytes 0-${stats.size - 1}/${stats.size}`);
      res.setHeader('Content-Disposition', responseType === 'stream' ? `attachment; filename=${path.basename(currentLocation)}` : 'inline');

      const etag = `"${hashAny(`${stats.size}-${stats.mtimeMs}`)}"`;
      const clientETag = req.headers['if-none-match'];
      const clientModifiedSince = req.headers['if-modified-since'];
      const bypassCache =
        req.headers['cache-control'] === 'no-cache' ||
        req.headers['pragma'] === 'no-cache';
      
      const clientDate = clientModifiedSince ? new Date(clientModifiedSince) : null;
      const serverDate = new Date(stats.mtime);
      const isETagFresh = clientETag === etag;
      const isLastModifiedFresh = clientDate && serverDate <= clientDate;

      res.setHeader('ETag', etag);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      
      if (!bypassCache && (isETagFresh || isLastModifiedFresh)) {
        res.status(304).end();
        return;
      }

      if (responseType === 'stream') {
        return ResourceHandler.streamFileResource(currentLocation, resource, req, res, next);
      }

      const { data, meta } = await ResourceUtils.readFile(currentLocation);

      if (responseType === 'json') {
        typedResponse(res, {
          data,
          meta,
        });
      } else {
        if (responseType === 'text') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
        else if (responseType === 'html') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        else if (responseType === 'xml') {
          res.setHeader('Content-Type', 'application/xml');
        }
        else if (responseType === 'csv') {
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        }
        else if (responseType === 'yaml') {
          res.setHeader('Content-Type', 'application/x-yaml');
        }
        else if (responseType === 'toml') {
          res.setHeader('Content-Type', 'application/toml');
        }
        else {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
        res.send(data);
      }

      return;
    }

    const absolutePaths = await ResourceUtils.listFiles(currentLocation, recursive, resource.extensions ?? []);
    const relativePaths = absolutePaths.map((filePath) => path.relative(currentLocation, filePath));

    Logger.debug(`Resolving (route) options for: ${resource.slug}`, {
      absolutePaths,
      relativePaths,
    });

    typedResponse(res, {
      data: relativePaths,
      meta: {
        slug: resource.slug,
        query,
        currentLocation,
        recursive,
        responseType,
      },
    });
  };

  private readonly handlePostRequest = async (
    resource: ParsedResource,
    query: {
      currentLocation: string;
      encoding?: BufferEncoding | null | undefined;
    },
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { currentLocation, encoding } = query;
    const stats = await stat(currentLocation);
    const currentIsFile = stats.isFile();

    if (!currentIsFile) {
      next(new APIError({
        code: APIErrorCode.BAD_REQUEST,
        message: 'Invalid request',
        status: 400,
        details: {
          slug: resource.slug,
          query,
          error: 'The current target/cursor is not a file, and cannot be written to',
        },
      }));
      return;
    }

    Logger.debug(`[POST] Resource found: ${resource.slug}`, resource, {
      query,
      currentLocation,
      currentIsFile,
      ...stats,
    });

    if (typeof req.body !== 'string') {
      next(new APIError({
        code: APIErrorCode.BAD_REQUEST,
        message: 'Invalid request',
        status: 400,
        details: {
          slug: resource.slug,
          query,
          error: 'The request body is not a string, and cannot be written to the file',
        },
      }));
      return;
    }
    
    await ResourceUtils.writeFile(currentLocation, req.body, { encoding });

    res.status(201).end();
  };

  private readonly handleDeleteRequest = async (
    resource: ParsedResource,
    query: {
      currentLocation: string;
      force: boolean;
    },
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { currentLocation, force } = query;
    const stats = await stat(currentLocation);
    const currentIsFile = stats.isFile();

    if (!currentIsFile && !force) {
      next(new APIError({
        code: APIErrorCode.BAD_REQUEST,
        message: 'Invalid request',
        status: 400,
        details: {
          slug: resource.slug,
          query,
          error: 'The current target/cursor is not a file, and cannot be deleted. Use "force" to delete directories',
        },
      }));
      return;
    }

    Logger.debug(`[DELETE] Resource found: ${resource.slug}`, resource, {
      query,
      currentLocation,
      currentIsFile,
      ...stats,
    });

    await ResourceUtils.deleteTarget(currentLocation, currentIsFile ? 'file' : 'directory');

    res.status(204).end();
  };

  private readonly handleExecuteSSERequest = async (
    resource: ParsedResource,
    query: { currentLocation: string },
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!resource.executable) {
      return next(new APIError({
        code: APIErrorCode.BAD_REQUEST,
        message: 'Invalid request',
        status: 400,
        details: {
          slug: resource.slug,
          query,
          error: 'The resource is not executable',
        },
      }));
    }
  
    const { currentLocation } = query;
    const { command, args, env, cwd, timeout, detached, shell } = resource.executable;
  
    Logger.debug(`[EXECUTE:SSE] Running command: ${resource.slug}`, resource, {
      query,
      currentLocation,
      command,
      args,
      env,
      cwd,
      timeout,
      detached,
      shell,
    });

    const sendEvent = (type: string, data: string) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${data.replace(/\n/g, '\ndata: ')}\n\n`);
    };
  
    try {
      const child = spawn(command, Array.isArray(args) ? args : [args], {
        cwd,
        env: {
          ...(resource.executable['inject-current-env'] ? process.env : {}),
          ...env,
        },
        shell,
        detached,
        timeout,
      });
  
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
  
      child.stdout.on('data', (chunk) => {
        sendEvent('stdout', chunk.toString());
      });
  
      child.stderr.on('data', (chunk) => {
        sendEvent('stderr', chunk.toString());
      });
  
      child.on('close', (code) => {
        sendEvent('exit', `Process exited with code ${code}`);
        res.end();
      });
  
      child.on('error', (err) => {
        sendEvent('error', err.message);
        res.end();
      });
    } catch (error) {
      Logger.error('[EXECUTE:SSE] Failed', error);
      sendEvent('error', 'Failed to execute command');
      res.end();
    }
  };

  public readonly handleRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { slug } = req.params;
    const { query } = req;
    const resource = this.parser.filters.bySlug(slug);

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

    if (req.method === 'HEAD') {
      const cacheControlPolicy = resource['cache-control'];
      res.setHeader('Cache-Control', ResourceHandler.buildCacheControlHeader(cacheControlPolicy));
      res.status(200).end();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', 'HEAD, OPTIONS, GET, POST, DELETE, EXECUTE');
      res.status(200).end();
      return;
    }

    const cursor = (Array.isArray(query.cursor) ? query.cursor.join('/') : query.cursor?.toString()) || null;
    const currentLocation = resource.type === 'file'
      ? await ResourceHandler.getResourceFile(resource, { cursor })
      : path.resolve(resource.target, cursor ?? '');

    if (req.method === 'GET') {
      return await this.handleGetRequest(resource, {
        currentLocation,
        recursive: query.recursive === 'true',
        type: ResourceUtils.resolveResponseType(query.type?.toString(), 'stream'),
      }, req, res, next);
    }

    if (req.method === 'POST') {
      return await this.handlePostRequest(resource, {
        currentLocation,
        encoding: ResourceUtils.resolveEncoding(query.encoding?.toString(), 'utf-8'),
      }, req, res, next);
    }

    if (req.method === 'DELETE') {
      return await this.handleDeleteRequest(resource, {
        currentLocation,
        force: query.force === 'true',
      }, req, res, next);
    }

    if (req.method === 'EXECUTE') {
      return await this.handleExecuteSSERequest(resource, {
        currentLocation,
      }, req, res, next);
    }

    next(new APIError({
      code: APIErrorCode.METHOD_NOT_ALLOWED,
      message: 'Method not allowed',
      status: 405,
      details: {
        slug,
        query,
      },
    }));
  };
}

export default ResourceHandler;
