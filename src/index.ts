import express from 'express';
import rTracer from 'cls-rtracer';
import compression from 'compression';
import bodyParser from 'body-parser';

import { validateConfig } from '../config/internal/validate';
import { config, allRouteOptions } from './config';
import { apiErrorHandler, pageNotFound } from './modules/api-errors';
import { requireAPIKey } from './modules/auth';
import { setRequestId, transformJSONResponse } from './modules/json-response';
import { getRemoteFileController } from './modules/remote-files/getRemoteFile';
import rateLimiterMiddleware, { shortBurstRateLimiter } from './modules/rate-limiter';
import {
  deleteJsonDataController,
  getAllJSONDataController,
  getJSONDataController,
  patchJSONDataController,
  putJSONDataController
} from './modules/json-database/controller';
import { getRemoteDirectoryController } from './modules/remote-files/getRemoteDirectory';
import { debugLog } from './debug';
import { MS_IN_ONE_NS } from './magic';

// Initialize our express app
const app = express();

/**
 * Bind our `express` app middleware, and
 * start listening for requests
 */
export const main = () => {
  const start = process.hrtime();

  // Apply compression middleware as early as possible
  debugLog('Applying compression middleware');
  const compressionFilter = (req, res) => req.headers['x-no-compression'] ? false : compression.filter(req, res);
  app.use(compression({ filter: compressionFilter }));
    
  // Before we launch our application,
  // let's validate the configuration
  debugLog('Validating configuration');
  validateConfig();

  // Before our routes, apply Request ID middleware
  // and JSON response transformation middleware
  debugLog('Applying request ID & JSON response transformation middleware');
  app.use(rTracer.expressMiddleware());
  app.use(setRequestId);
  app.use(transformJSONResponse);

  // Bind (burst & brute-force) rate limit middleware before routes
  debugLog('Applying rate limit middleware');
  app.use(rateLimiterMiddleware(shortBurstRateLimiter));

  // Public status endpoint
  app.get('/', (req, res) => {
    res.status(200).send({ status: 'alive' });
    debugLog('Received status request: alive');
  });

  // Require a valid api key for every request
  debugLog('Applying API key middleware');
  app.use(requireAPIKey);
  debugLog('API key middleware applied, authentication required for all routes');

  // Provide an options endpoint
  // Private because we don't want targeted brute force attacks
  app.get(
    '/options',
    (req, res) => {
      res.json({
        data: allRouteOptions
      });
      debugLog(`Received options request, returning ${allRouteOptions.length} options`);
    }
  );

  app.get('*', (req, res, next) => {
    const { method, path } = req;
    next();
    console.log(`[REQUEST] ${method} ${path}`);
  });

  // Register all our remote file access endpoints
  app.get('/files/:name', getRemoteFileController);

  // Register all our remote directory access endpoints
  app.get('/directories/:name', getRemoteDirectoryController);

  // Register our JSON databases - yay!
  app.get('/json/:name', getAllJSONDataController);
  app.get('/json/:name/:identifier', getJSONDataController);
  app.delete('/json/:name/:identifier', deleteJsonDataController);

  // Let's parse request bodies for this PUT & PATCH functionality =)
  app.put(
    '/json/:name/:identifier',
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    putJSONDataController
  );
  app.patch(
    '/json/:name/:identifier',
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    patchJSONDataController
  );

  // API responses for any page request that is not found
  debugLog('Applying page/route not found middleware');
  app.get('*', (req, res, next) => next(pageNotFound(req)));

  // Finally - before listening, let's register our error handler
  // Note: The placement is important - your last middleware should
  // always be your error handler
  debugLog('Applying error handler middleware');
  app.use(apiErrorHandler);

  // Start listening for requests
  app.listen(config.PORT, () => {
    console.log(`[Remote File Access API] Listening on port ${config.PORT}`);
    const msSinceStart = (process.hrtime(start)[1] / MS_IN_ONE_NS).toFixed(2);
    debugLog(`Listening on port ${config.PORT} after ${msSinceStart}ms`);
  });
};

// Start our application
main();