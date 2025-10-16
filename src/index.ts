import app from './app';
import { config } from './config/env';
import { connectRedis } from './config/redis';
import logger from './config/logger';

const start = async () => {
  try {
    await connectRedis();
    app.listen(config.port, () => {
      logger.info('server:started', { port: config.port });
    });
  } catch (error) {
    logger.error('server:start_failed', { error });
    process.exit(1);
  }
};

start();
