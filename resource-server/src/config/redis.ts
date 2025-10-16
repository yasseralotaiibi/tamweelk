import Redis from 'ioredis';
import { config } from './env';
import logger from './logger';

export const redisClient = new Redis(config.redisUrl, {
  lazyConnect: true
});

redisClient.on('error', (error) => {
  logger.error('redis:error', { error: error.message });
});

export const connectRedis = async (): Promise<void> => {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
    return;
  }
  await redisClient.connect();
  logger.info('redis:connected');
};

export default redisClient;
