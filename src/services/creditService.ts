import { CreditCheck } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { fetchCreditReport } from '../connectors/simahConnector';

export type CreditCheckInput = {
  organizationId: string;
  userId: string;
  nationalId: string;
  purpose: string;
};

export const performCreditCheck = async (
  input: CreditCheckInput
): Promise<CreditCheck> => {
  const report = await fetchCreditReport({
    nationalId: input.nationalId,
    purpose: input.purpose,
  });

  logger.info('SIMAH report grade %s score %d', report.grade, report.score);

  return prisma.creditCheck.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      simahScore: report.score,
      delinquencyCount: report.delinquencyCount,
      exposureSar: report.exposureSar.toString(),
      report: {
        grade: report.grade,
        issuedAt: report.issuedAt,
        arrearsAmount: report.arrearsAmount.toString(),
      },
    },
  });
};
