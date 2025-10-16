import { Request, Response, NextFunction } from 'express';
import redisClient, { connectRedis } from '../config/redis';

const NONCE_PREFIX = 'nonce:';
const NONCE_TTL_SECONDS = 300;

export const nonceValidationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const nonce = (req.headers['x-nonce'] as string) || '';

  if (!nonce) {
    res.status(400).json({ error: 'Missing x-nonce header' });
    return;
  }

  try {
    await connectRedis();
    const exists = await redisClient.get(`${NONCE_PREFIX}${nonce}`);
    if (exists) {
      res.status(409).json({ error: 'Nonce already used' });
      return;
    }

    await redisClient.set(`${NONCE_PREFIX}${nonce}`, '1', 'EX', NONCE_TTL_SECONDS);
    next();
  } catch (error) {
    res.status(500).json({ error: 'Nonce validation failed', details: (error as Error).message });
  }
};

export default nonceValidationMiddleware;
