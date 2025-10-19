import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import logger from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    scope?: string;
    [key: string]: unknown;
  };
  dpop?: {
    thumbprint: string;
    jti: string;
  };
  organization?: {
    id: string;
    slug: string;
    riskThreshold: number;
    defaultAcr: string;
  };
  subjectRoles?: string[];
}

export const jwtValidationMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers['authorization'];
  if (!header) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = header.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedRequest['user'];
    const cnf = (decoded?.cnf as { jkt?: string } | undefined)?.jkt;
    if (cnf && req.dpop && cnf !== req.dpop.thumbprint) {
      res.status(401).json({ error: 'DPoP binding mismatch' });
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid JWT token: %s', (error as Error).message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
