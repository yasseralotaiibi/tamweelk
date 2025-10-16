import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next;
  logger.error('Unhandled error: %s', err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
};
