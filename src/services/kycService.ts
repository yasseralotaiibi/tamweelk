import { KycRecord, KycStatus } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { submitKycRequest, fetchKycStatus } from '../adapters/kycProvider';

export type SubmitKycInput = {
  organizationId: string;
  userId: string;
  nationalId: string;
  documentNumber: string;
  documentType: 'national_id' | 'iqama' | 'passport';
  firstName: string;
  lastName: string;
};

export const submitKyc = async (input: SubmitKycInput): Promise<KycRecord> => {
  const response = await submitKycRequest({
    nationalId: input.nationalId,
    documentNumber: input.documentNumber,
    documentType: input.documentType,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  logger.info('KYC provider submission returned %s', response.reference);

  return prisma.kycRecord.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      providerReference: response.reference,
      status: response.status as KycStatus,
      documentsOk: true,
      riskScore: 0,
      result: {
        nationalId: input.nationalId,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    },
  });
};

export const refreshKycStatus = async (
  organizationId: string,
  providerReference: string
): Promise<KycRecord> => {
  const current = await prisma.kycRecord.findUnique({
    where: { organizationId_providerReference: { organizationId, providerReference } },
  });

  if (!current) {
    throw new Error('KYC record not found for reference');
  }

  const providerStatus = await fetchKycStatus(providerReference);

  const status: KycStatus = providerStatus.status === 'FAILED' ? KycStatus.FAILED : KycStatus.VERIFIED;
  const riskScore = providerStatus.pepFlag || providerStatus.sanctionsFlag ? 90 : current.riskScore;

  return prisma.kycRecord.update({
    where: { id: current.id },
    data: {
      status,
      pepFlag: providerStatus.pepFlag,
      sanctionsFlag: providerStatus.sanctionsFlag,
      documentsOk: providerStatus.documentsOk,
      riskScore,
      result: {
        ...(current.result as Record<string, unknown>),
        providerResponseAt: new Date().toISOString(),
      },
    },
  });
};

export const upsertWebhookKyc = async (
  organizationId: string,
  payload: { reference: string; status: 'VERIFIED' | 'FAILED'; pepFlag?: boolean; sanctionsFlag?: boolean }
): Promise<KycRecord> => {
  const existing = await prisma.kycRecord.findUnique({
    where: { organizationId_providerReference: { organizationId, providerReference: payload.reference } },
  });

  if (!existing) {
    throw new Error('KYC record not found for webhook reference');
  }

  const status = payload.status === 'FAILED' ? KycStatus.FAILED : KycStatus.VERIFIED;

  return prisma.kycRecord.update({
    where: { id: existing.id },
    data: {
      status,
      pepFlag: payload.pepFlag ?? existing.pepFlag,
      sanctionsFlag: payload.sanctionsFlag ?? existing.sanctionsFlag,
      riskScore: payload.status === 'FAILED' ? 95 : existing.riskScore,
      result: {
        ...(existing.result as Record<string, unknown>),
        webhookReceivedAt: new Date().toISOString(),
      },
    },
  });
};
