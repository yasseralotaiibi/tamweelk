import { Consent, ConsentStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { appendAuditTrail, assertDataMinimisation, issueConsentReceipt } from '../utils/pdpl';

export type CreateConsentInput = {
  organizationId: string;
  userId: string;
  provider: string;
  scopes: string[];
  expiresAt: Date;
};

export const createConsent = async (input: CreateConsentInput): Promise<Consent> => {
  assertDataMinimisation(input.scopes);

  const consent = await prisma.consent.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      provider: input.provider,
      scopes: input.scopes,
      status: ConsentStatus.ACTIVE,
      expiresAt: input.expiresAt,
    },
  });

  const resource = await prisma.resource.create({
    data: {
      organizationId: input.organizationId,
      type: 'consent',
      referenceId: consent.id,
      attributes: {
        scopes: input.scopes,
        userId: input.userId,
      },
      classification: 'restricted',
    },
  });

  await prisma.relation.createMany({
    data: [
      {
        organizationId: input.organizationId,
        subjectType: 'user',
        subjectId: input.userId,
        resourceId: resource.id,
        relation: 'owner',
      },
    ],
  });

  await issueConsentReceipt({
    consentId: consent.id,
    subjectId: input.userId,
    scopes: input.scopes,
    issuedAt: new Date(),
  });

  await appendAuditTrail('CONSENT_CREATED', {
    consentId: consent.id,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  return consent;
};

export const listConsents = async (
  organizationId: string,
  filters?: { userId?: string; status?: ConsentStatus }
): Promise<Consent[]> => {
  return prisma.consent.findMany({
    where: {
      organizationId,
      userId: filters?.userId,
      status: filters?.status,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const revokeConsent = async (
  organizationId: string,
  id: string
): Promise<Consent> => {
  const consent = await prisma.consent.update({
    where: { id },
    data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
  });

  await appendAuditTrail('CONSENT_REVOKED', { consentId: id, organizationId });

  return consent;
};
