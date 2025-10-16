import { v4 as uuid } from 'uuid';
import redisClient, { connectRedis } from '../config/redis';
import { config } from '../config/env';
import logger from '../config/logger';

const CIBA_PREFIX = 'ciba:';
const EXPIRY_SECONDS = 300;

type CibaStatus = 'PENDING' | 'APPROVED' | 'DENIED';

interface CibaSession {
  authReqId: string;
  clientId: string;
  scope: string;
  loginHint: string;
  status: CibaStatus;
}

export const createAuthRequest = async (input: {
  clientId: string;
  scope: string;
  loginHint: string;
}): Promise<{ authReqId: string; expiresIn: number; interval: number }> => {
  await connectRedis();
  const authReqId = uuid();
  const session: CibaSession = {
    authReqId,
    clientId: input.clientId,
    scope: input.scope,
    loginHint: input.loginHint,
    status: 'PENDING'
  };

  await redisClient.set(`${CIBA_PREFIX}${authReqId}`, JSON.stringify(session), 'EX', EXPIRY_SECONDS);
  logger.info('ciba:request_created', { authReqId, clientId: input.clientId });

  return {
    authReqId,
    expiresIn: EXPIRY_SECONDS,
    interval: config.cibaPollInterval
  };
};

export const getSession = async (authReqId: string): Promise<CibaSession | null> => {
  await connectRedis();
  const payload = await redisClient.get(`${CIBA_PREFIX}${authReqId}`);
  if (!payload) {
    return null;
  }
  return JSON.parse(payload) as CibaSession;
};

export const updateSessionStatus = async (
  authReqId: string,
  status: CibaStatus
): Promise<CibaSession | null> => {
  const session = await getSession(authReqId);
  if (!session) {
    return null;
  }

  const updated: CibaSession = { ...session, status };
  await redisClient.set(`${CIBA_PREFIX}${authReqId}`, JSON.stringify(updated), 'EX', EXPIRY_SECONDS);
  logger.info('ciba:status_updated', { authReqId, status });
  return updated;
};

export const pollForTokens = async (
  authReqId: string
): Promise<
  | { status: 'PENDING'; interval: number }
  | { status: 'DENIED' }
  | { status: 'APPROVED'; accessToken: string; idToken: string }
> => {
  const session = await getSession(authReqId);

  if (!session) {
    return { status: 'DENIED' };
  }

  if (session.status === 'PENDING') {
    return { status: 'PENDING', interval: config.cibaPollInterval };
  }

  if (session.status === 'DENIED') {
    return { status: 'DENIED' };
  }

  return {
    status: 'APPROVED',
    accessToken: `access-${authReqId}`,
    idToken: `id-${authReqId}`
  };
};
