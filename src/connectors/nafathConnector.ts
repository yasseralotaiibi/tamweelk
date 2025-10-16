import logger from '../config/logger';
import config from '../config/env';

type NafathAuthRequest = {
  nationalId: string;
  channel: 'mobile' | 'web';
};

type NafathAuthResponse = {
  transactionId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
};

export const initiateNafathAuth = async (
  payload: NafathAuthRequest
): Promise<NafathAuthResponse> => {
  logger.info(
    'Initiating Nafath auth for %s via %s with clientId %s',
    payload.nationalId,
    payload.channel,
    config.nafathClientId
  );
  return {
    transactionId: `nafath-${Date.now()}`,
    status: 'PENDING',
  };
};

export const resolveNafathAuth = async (
  transactionId: string,
  decision: 'APPROVED' | 'DENIED'
): Promise<NafathAuthResponse> => {
  logger.info('Resolving Nafath auth %s with %s', transactionId, decision);
  return {
    transactionId,
    status: decision,
  };
};
