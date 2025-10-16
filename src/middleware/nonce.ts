import type { RequestHandler } from 'express';
import redis, { ensureRedisConnection } from '../config/redis';
import logger from '../config/logger';

const NONCE_TTL_SECONDS = 300;

export const nonceValidationMiddleware: RequestHandler = async (req, res, next) => {
  const nonce = (req.headers['x-nonce'] as string) || (req.body && req.body.nonce);

  if (!nonce) {
    res.status(400).json({ error: 'Missing nonce header (x-nonce)' });
    return;
  }

  try {
    await ensureRedisConnection();
    const exists = await redis.get(`nonce:${nonce}`);
    if (exists) {
      res.status(409).json({ error: 'Nonce already used' });
      return;
    }
    await redis.set(`nonce:${nonce}`, '1', 'EX', NONCE_TTL_SECONDS);
    next();
  } catch (error) {
    logger.error('Failed to validate nonce: %s', (error as Error).message);
    next(error);
  }
};
