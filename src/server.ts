import app from './app';
import config from './config/env';
import logger from './config/logger';
import redis, { ensureRedisConnection } from './config/redis';
import prisma from './config/prisma';

const start = async (): Promise<void> => {
  try {
    await ensureRedisConnection();
    logger.info('Connected to Redis at %s', config.redisUrl);
  } catch (error) {
    logger.error('Unable to connect to Redis: %s', (error as Error).message);
  }

  try {
    await prisma.$connect();
    logger.info('Connected to Postgres');
  } catch (error) {
    logger.error('Unable to connect to Postgres: %s', (error as Error).message);
  }

  const server = app.listen(config.port, () => {
    logger.info(`Riyada OpenBanking API listening on port ${config.port}`);
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Gracefully shutting down');
    await prisma.$disconnect();
    await redis.quit();
    server.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

void start();
