import { Router, type NextFunction, type Request, type Response } from 'express';
import { Logger } from '../logger';
import { APIError } from '../modules/api-errors';
import { typedResponse } from '../response';
import v1Router from './v1/routes';

const router = Router();

router.get('/', (req, res) => {
  typedResponse(res, {
    data: {
      status: 'alive',
    },
  });
  Logger.debug('Received status request: alive');
});

router.use('/api/v1', v1Router);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof APIError) {
    typedResponse(res, err, err.status);
  } else {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development'
            ? typeof err === 'object' && err !== null
              ? (err as Error).message
              : String(err)
            : 'An unexpected error occurred',
      },
    });
  }
});

export default router;
