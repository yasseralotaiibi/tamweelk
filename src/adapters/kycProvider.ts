import logger from '../config/logger';

type KycSubmission = {
  nationalId: string;
  documentNumber: string;
  documentType: 'national_id' | 'iqama' | 'passport';
  firstName: string;
  lastName: string;
};

type KycSubmissionResponse = {
  reference: string;
  status: 'SUBMITTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
};

type KycStatusResponse = {
  reference: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
  pepFlag: boolean;
  sanctionsFlag: boolean;
  documentsOk: boolean;
};

export const submitKycRequest = async (
  payload: KycSubmission
): Promise<KycSubmissionResponse> => {
  const reference = `kyc-${payload.nationalId}-${Date.now()}`;
  logger.info('Submitting KYC request to provider for %s', payload.nationalId);
  return {
    reference,
    status: 'PENDING',
  };
};

export const fetchKycStatus = async (reference: string): Promise<KycStatusResponse> => {
  const trailing = parseInt(reference.slice(-1), 10);
  const verified = Number.isFinite(trailing) ? trailing % 5 !== 0 : true;
  logger.info('Fetching KYC status for reference %s', reference);
  return {
    reference,
    status: verified ? 'VERIFIED' : 'FAILED',
    pepFlag: false,
    sanctionsFlag: !verified && reference.length % 2 === 0,
    documentsOk: verified,
  };
};
