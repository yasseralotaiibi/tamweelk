import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';

export interface AuditEvent {
  type: string;
  actorId?: string;
  consentId?: string;
  details?: Prisma.InputJsonValue;
}

export const createAuditEvent = async (event: AuditEvent): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        type: event.type,
        actorId: event.actorId,
        consentId: event.consentId,
        details: event.details ?? {}
      }
    });
  } catch (error) {
    logger.error('audit:create_failed', { error });
  }
};
