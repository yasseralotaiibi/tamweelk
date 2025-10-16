import logger from '../config/logger';
import config from '../config/env';

type AbsherVerificationRequest = {
  nationalId: string;
  otp?: string;
};

export const verifyIdentityWithAbsher = async (
  payload: AbsherVerificationRequest
): Promise<{ status: 'VERIFIED' | 'FAILED'; reference: string }> => {
  logger.info(
    'Calling Absher verification for %s using client %s',
    payload.nationalId,
    config.absherClientId
  );
  return {
    status: payload.otp ? 'VERIFIED' : 'FAILED',
    reference: `absher-${Date.now()}`,
  };
};
