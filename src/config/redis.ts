import Redis from 'ioredis';
import config from './env';

const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: true,
});

export const ensureRedisConnection = async (): Promise<void> => {
  if (redis.status === 'ready' || redis.status === 'connecting') {
    return;
  }

  await redis.connect();
};

export default redis;
