import dotenv from 'dotenv';

dotenv.config();

type AppConfig = {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  redisUrl: string;
  databaseUrl: string;
  nafathClientId: string;
  absherClientId: string;
  simahClientId: string;
};

const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'demo-secret',
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/openbanking',
  nafathClientId: process.env.NAFATH_CLIENT_ID || 'nafath-demo-client',
  absherClientId: process.env.ABSHER_CLIENT_ID || 'absher-demo-client',
  simahClientId: process.env.SIMAH_CLIENT_ID || 'simah-demo-client',
};

export default config;
