import { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './jwtAuth';
import { importJWK, jwtVerify, calculateJwkThumbprint } from 'jose';
import type { JWK } from 'jose';
import redis from '../config/redis';
import logger from '../config/logger';

const DPOP_CACHE_PREFIX = 'dpop-jti:';

const buildHtu = (req: AuthenticatedRequest): string => {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost';
  const protocol = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
  return `${protocol}://${host}${req.originalUrl}`;
};

export const dpopValidationMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers['dpop'];
  if (!header || typeof header !== 'string') {
    res.status(401).json({ error: 'Missing DPoP proof' });
    return;
  }

  try {
    const { payload, protectedHeader } = await jwtVerify(
      header,
      async (header) => {
        if (!header.jwk) {
          throw new Error('Missing JWK in DPoP header');
        }
        return importJWK(header.jwk as Parameters<typeof importJWK>[0], header.alg || 'ES256');
      },
      {
        typ: 'dpop+jwt',
        clockTolerance: '2s',
      }
    );

    const expectedHtu = buildHtu(req);
    if (payload.htu !== expectedHtu) {
      logger.warn('DPoP htu mismatch expected %s actual %s', expectedHtu, payload.htu);
      res.status(401).json({ error: 'Invalid DPoP htu' });
      return;
    }

    if ((payload.htm as string | undefined)?.toUpperCase() !== req.method.toUpperCase()) {
      res.status(401).json({ error: 'Invalid DPoP htm' });
      return;
    }

    const jwk = (protectedHeader?.jwk ?? {}) as JWK;
    const thumbprint = await calculateJwkThumbprint(jwk);

    const cacheKey = `${DPOP_CACHE_PREFIX}${payload.jti}`;
    const existing = await redis.get(cacheKey);
    if (existing) {
      res.status(401).json({ error: 'DPoP replay detected' });
      return;
    }

    await redis.set(cacheKey, '1', 'EX', 900);
    (req as AuthenticatedRequest & { dpop?: { thumbprint: string; jti: string } }).dpop = {
      thumbprint,
      jti: String(payload.jti),
    };

    next();
  } catch (error) {
    logger.warn('DPoP verification failed: %s', (error as Error).message);
    res.status(401).json({ error: 'Invalid DPoP proof' });
  }
};
