import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const mtlsEnforcementPlaceholder = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.debug('mTLS placeholder executed - integrate certificate validation in production');
  next();
};
