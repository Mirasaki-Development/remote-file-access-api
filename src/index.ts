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

// Initialize our express app
const app = express();

/**
 * Bind our `express` app middleware, and
 * start listening for requests
 */
export const main = () => {
  // Apply compression middleware as early as possible
  const compressionFilter = (req, res) => req.headers['x-no-compression'] ? false : compression.filter(req, res);
  app.use(compression({ filter: compressionFilter }));
    
  // Before we launch our application,
  // let's validate the configuration
  validateConfig();

  // Before our routes, apply Request ID middleware
  app.use(rTracer.expressMiddleware());
  app.use(setRequestId);
  app.use(transformJSONResponse);

  // Bind (burst & brute-force) rate limit middleware before routes
  app.use(rateLimiterMiddleware(shortBurstRateLimiter));

  // Public status endpoint
  app.get('/', (req, res) => res.status(200).send({ status: 'alive' }));

  // Require a valid api key for every request
  app.use(requireAPIKey);

  // Provide an options endpoint
  // Private because we don't want targeted brute force attacks
  app.get(
    '/options',
    (req, res) => res.json({
      data: allRouteOptions
    })
  );

  // Register all our remote file access endpoints
  app.get('/files/:name', getRemoteFileController);

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
  app.get('*', (req, res, next) => next(pageNotFound(req)));

  // Finally - before listening, let's register our error handler
  // Note: The placement is important - your last middleware should
  // always be your error handler
  app.use(apiErrorHandler);

  // Start listening for requests
  app.listen(config.PORT);
};

// Start our application
main();