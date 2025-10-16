import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  logger.debug('prisma:query', { model: params.model, action: params.action });
  const result = await next(params);
  return result;
});

export default prisma;
