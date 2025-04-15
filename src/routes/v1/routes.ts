import { Router } from 'express';
import { Authentication } from '../../modules/auth';
import ResourceHandler from '../../resources/handler';
import { typedResponse } from '../../response';

const v1Router = Router();

v1Router.get('/', Authentication.requireMasterAPIKey, async (req, res) => {
  const handler = await ResourceHandler.getInstance();
  typedResponse(res, {
    data: handler.parser.slugs,
    meta: {
      count: handler.parser.slugs.length,
    },
  });
});

v1Router.get(
  '/:slug',
  Authentication.requireAuthorization,
  async (...args) => {
    const handler = await ResourceHandler.getInstance();
    handler.handleRequest(...args);
  },
);

export default v1Router;
