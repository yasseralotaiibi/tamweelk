import { PrismaClient } from '@prisma/client';
import config from './env';
import logger from './logger';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: [{ emit: 'event', level: 'query' }],
});

prisma.$on('query', (event) => {
  logger.debug('Prisma query: %o', {
    query: event.query,
    params: event.params,
    duration: event.duration,
  });
});

export default prisma;
