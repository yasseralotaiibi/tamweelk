import { Consent, ConsentStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { appendAuditTrail, assertDataMinimisation, issueConsentReceipt } from '../utils/pdpl';

export type CreateConsentInput = {
  customerId: string;
  scopes: string[];
  expiresAt: Date;
  provider: string;
};

export const createConsent = async (input: CreateConsentInput): Promise<Consent> => {
  assertDataMinimisation(input.scopes);

  const consent = await prisma.consent.create({
    data: {
      customerId: input.customerId,
      provider: input.provider,
      scopes: input.scopes,
      status: ConsentStatus.ACTIVE,
      expiresAt: input.expiresAt,
    },
  });

  await issueConsentReceipt({
    consentId: consent.id,
    subjectId: input.customerId,
    scopes: input.scopes,
    issuedAt: new Date(),
  });

  await appendAuditTrail('CONSENT_CREATED', {
    consentId: consent.id,
    customerId: input.customerId,
  });

  return consent;
};

export const listConsents = async (customerId?: string): Promise<Consent[]> => {
  return prisma.consent.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
};

export const revokeConsent = async (id: string): Promise<Consent> => {
  const consent = await prisma.consent.update({
    where: { id },
    data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
  });

  await appendAuditTrail('CONSENT_REVOKED', { consentId: id });

  return consent;
};
