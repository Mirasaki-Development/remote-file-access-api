import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../logger';
import { APIError, APIErrorCode } from './api-errors';

/**
 * Block Strategy against really powerful DDoS attacks (like 100k requests per sec)
 * ref: {@link https://github.com/animir/node-rate-limiter-flexible/wiki/In-memory-Block-Strategy}
 */
export const shortBurstRateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 1,
});

const rateLimiterMiddleware = (limiter) => {
  return async (req, res, next) => {
    limiter.consume(req.ip)
      .then(({
        remainingPoints,
        msBeforeNext,
        consumedPoints,
        // isFirstInDuration
      }) => {
        const rlHeaders = {
          'X-RateLimit-Next': msBeforeNext / 1000,
          'X-RateLimit-Limit': limiter._points,
          'X-RateLimit-Remaining': remainingPoints,
          'X-RateLimit-Consumed': consumedPoints,
          'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext),
        };
        res.set(rlHeaders);
        next();
        logger.debug('Rate limit headers for IP:', rlHeaders);
      })
      .catch(({
        remainingPoints,
        msBeforeNext,
        consumedPoints,
      }) => {
        const rlHeaders = {
          'Retry-After': msBeforeNext / 1000,
          'X-RateLimit-Limit': limiter._points,
          'X-RateLimit-Remaining': remainingPoints,
          'X-RateLimit-Consumed': consumedPoints,
          'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext),
        };
        res.set(rlHeaders);
        next(new APIError({
          code: APIErrorCode.FORBIDDEN,
          message: 'Rate limit reached',
          status: 429,
          details: rlHeaders,
        }));
        logger.debug('Rate limit reached for IP:', rlHeaders);
        return;
      });
  };
};

export default rateLimiterMiddleware;
