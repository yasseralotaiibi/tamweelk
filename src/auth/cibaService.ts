import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import redis, { ensureRedisConnection } from '../config/redis';
import config from '../config/env';
import logger from '../config/logger';

export type CibaAuthStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';

export interface CibaAuthSession {
  authReqId: string;
  clientId: string;
  loginHint: string;
  scope: string[];
  expiresAt: number;
  status: CibaAuthStatus;
  subject?: string;
}

const AUTH_TTL_SECONDS = 300;

const serializeKey = (authReqId: string): string => `ciba:auth:${authReqId}`;

export const initiateCibaAuth = async (params: {
  clientId: string;
  loginHint: string;
  scope: string[];
}): Promise<{ authReqId: string; expiresIn: number; interval: number }> => {
  const authReqId = uuid();
  const expiresAt = Date.now() + AUTH_TTL_SECONDS * 1000;
  const session: CibaAuthSession = {
    authReqId,
    clientId: params.clientId,
    loginHint: params.loginHint,
    scope: params.scope,
    expiresAt,
    status: 'PENDING',
  };

  await ensureRedisConnection();
  await redis.set(serializeKey(authReqId), JSON.stringify(session), 'EX', AUTH_TTL_SECONDS);
  logger.info('CIBA auth initiated %s for %s', authReqId, params.loginHint);

  return { authReqId, expiresIn: AUTH_TTL_SECONDS, interval: 5 };
};

export const approveCibaAuth = async (authReqId: string, subject: string): Promise<void> => {
  await transitionAuthSession(authReqId, 'APPROVED', subject);
};

export const denyCibaAuth = async (authReqId: string): Promise<void> => {
  await transitionAuthSession(authReqId, 'DENIED');
};

export const pollCibaToken = async (
  authReqId: string
): Promise<
  | {
      accessToken: string;
      idToken: string;
      expiresIn: number;
      scope: string[];
    }
  | 'PENDING'
  | 'DENIED'
  | 'EXPIRED'
> => {
  await ensureRedisConnection();
  const payload = await redis.get(serializeKey(authReqId));

  if (!payload) {
    return 'EXPIRED';
  }

  const session = JSON.parse(payload) as CibaAuthSession;

  if (session.status === 'PENDING') {
    return 'PENDING';
  }

  if (session.status === 'DENIED') {
    return 'DENIED';
  }

  if (session.expiresAt < Date.now()) {
    return 'EXPIRED';
  }

  const accessToken = jwt.sign(
    { sub: session.loginHint, scope: session.scope.join(' ') },
    config.jwtSecret,
    { expiresIn: '15m', audience: session.clientId, issuer: 'riyada-openbanking' }
  );
  const idToken = jwt.sign({ sub: session.loginHint, amr: ['urn:nafath:push'] }, config.jwtSecret, {
    expiresIn: '15m',
    audience: session.clientId,
    issuer: 'riyada-openbanking',
  });

  await redis.del(serializeKey(authReqId));

  return {
    accessToken,
    idToken,
    expiresIn: 900,
    scope: session.scope,
  };
};

const transitionAuthSession = async (
  authReqId: string,
  status: CibaAuthStatus,
  subject?: string
): Promise<void> => {
  await ensureRedisConnection();
  const payload = await redis.get(serializeKey(authReqId));
  if (!payload) {
    throw new Error('Unknown auth_req_id');
  }

  const session = JSON.parse(payload) as CibaAuthSession;
  if (session.expiresAt < Date.now()) {
    throw new Error('auth_req_id expired');
  }

  session.status = status;
  session.subject = subject || session.subject;

  const remainingTtl = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
  await redis.set(serializeKey(authReqId), JSON.stringify(session), 'EX', remainingTtl);
};
