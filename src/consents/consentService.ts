import { Consent, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { createAuditEvent } from '../audit/auditService';
import { enforceDataMinimisation, issueConsentReceipt } from '../compliance/pdplHooks';

export interface ConsentInput {
  subject: string;
  purpose: string;
  scopes: string[];
  expiresAt?: string;
}

const toJsonObject = (payload: unknown): Prisma.JsonObject => {
  return JSON.parse(JSON.stringify(payload || {}));
};

export const createConsent = async (
  input: ConsentInput
): Promise<{ consent: Consent; receiptId: string }> => {
  await enforceDataMinimisation(input);

  const consent = await prisma.consent.create({
    data: {
      subject: input.subject,
      purpose: input.purpose,
      scopes: input.scopes,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
    }
  });

  const receipt = await issueConsentReceipt(consent);
  await createAuditEvent({
    type: 'CONSENT_CREATED',
    consentId: consent.id,
    details: toJsonObject({ receipt })
  });

  return { consent, receiptId: receipt.consentId };
};

export const listConsents = async (): Promise<Consent[]> => {
  return prisma.consent.findMany({ orderBy: { createdAt: 'desc' } });
};

export const revokeConsent = async (id: string): Promise<Consent | null> => {
  try {
    const consent = await prisma.consent.update({
      where: { id },
      data: { revokedAt: new Date() }
    });

    await createAuditEvent({
      type: 'CONSENT_REVOKED',
      consentId: id,
      details: toJsonObject({ revokedAt: consent.revokedAt?.toISOString() })
    });

    return consent;
  } catch (error) {
    return null;
  }
};
