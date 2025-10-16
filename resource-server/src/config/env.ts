import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtAudience: string;
  jwtIssuer: string;
  cibaPollInterval: number;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/openbanking',
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
  jwtAudience: process.env.JWT_AUDIENCE || 'riyadah-open-banking',
  jwtIssuer: process.env.JWT_ISSUER || 'https://auth.riyada.local',
  cibaPollInterval: Number(process.env.CIBA_POLL_INTERVAL) || 5
};

export const securityPlaceholders = {
  mtls: 'mTLS enforcement placeholder. Integrate with API Gateway/Ingress enforcement.',
  jws: 'JWS signing placeholder. Use private keys stored in HSM/KMS to sign responses.',
  zeroTrust: 'Zero-trust enforcement placeholder. Implement continuous verification policies.'
};
