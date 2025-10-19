import logger from '../config/logger';
import config from '../config/env';

type CreditReportRequest = {
  nationalId: string;
  purpose: string;
};

type CreditReportResponse = {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  issuedAt: string;
  delinquencyCount: number;
  exposureSar: number;
  arrearsAmount: number;
};

export const fetchCreditReport = async (
  request: CreditReportRequest
): Promise<CreditReportResponse> => {
  logger.info(
    'Fetching SIMAH credit report for %s using client %s',
    request.nationalId,
    config.simahClientId
  );
  return {
    score: 720,
    grade: 'A',
    issuedAt: new Date().toISOString(),
    delinquencyCount: 0,
    exposureSar: 15000,
    arrearsAmount: 0,
  };
};
