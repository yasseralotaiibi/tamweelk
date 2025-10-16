import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const jwsSigningPlaceholder = (_req: Request, _res: Response, next: NextFunction): void => {
  logger.debug('JWS placeholder executed - ensure JOSE signing/validation in production');
  next();
};
