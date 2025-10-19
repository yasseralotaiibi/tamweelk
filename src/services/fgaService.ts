import { PolicyEffect } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../config/logger';

export type Subject = {
  id: string;
  type: 'user' | 'service' | 'role';
  roles?: string[];
  scopes?: string[];
};

export type AccessCheckInput = {
  organizationId: string;
  subject: Subject;
  action: string;
  resourceType: string;
  resourceId: string;
  context?: Record<string, unknown>;
};

const loadRolesForSubject = async (
  organizationId: string,
  subject: Subject
): Promise<string[]> => {
  if (subject.type !== 'user') {
    return subject.roles ?? [];
  }

  const memberships = await prisma.userOrg.findMany({
    where: { organizationId, userId: subject.id },
    select: { role: true },
  });
  return Array.from(new Set([...(subject.roles ?? []), ...memberships.map((m) => m.role)]));
};

const matchesPolicySubject = (
  policySubjectType: string,
  policyAttributes: Record<string, unknown> | null,
  subject: Subject,
  roles: string[]
): boolean => {
  if (policySubjectType === 'role') {
    const requiredRoles = (policyAttributes?.roles as string[] | undefined) ?? [];
    return requiredRoles.some((role) => roles.includes(role));
  }

  if (policySubjectType === 'user') {
    return subject.type === 'user' && subject.id === (policyAttributes?.id as string | undefined);
  }

  if (policySubjectType === 'service') {
    return subject.type === 'service';
  }

  return false;
};

const passesCondition = (
  condition: Record<string, unknown> | null | undefined,
  context: Record<string, unknown>
): boolean => {
  if (!condition) {
    return true;
  }

  if (typeof condition.maxRiskScore === 'number') {
    const riskScore = Number(context.riskScore ?? context['risk_assessment.score'] ?? 0);
    if (riskScore > (condition.maxRiskScore as number)) {
      return false;
    }
  }

  if (typeof condition.minCreditScore === 'number') {
    const creditScore = Number(context.creditScore ?? 0);
    if (creditScore < (condition.minCreditScore as number)) {
      return false;
    }
  }

  return true;
};

export const checkAccess = async (input: AccessCheckInput): Promise<boolean> => {
  const resource = await prisma.resource.findFirst({
    where: {
      id: input.resourceId,
      organizationId: input.organizationId,
      type: input.resourceType,
    },
  });

  if (!resource) {
    logger.warn('Resource %s not found for org %s', input.resourceId, input.organizationId);
    return false;
  }

  const roles = await loadRolesForSubject(input.organizationId, input.subject);
  const policies = await prisma.policy.findMany({
    where: {
      organizationId: input.organizationId,
      action: input.action,
      resourceType: input.resourceType,
    },
    orderBy: { priority: 'asc' },
  });

  const context = {
    ...input.context,
    resource,
  };

  let decision: PolicyEffect | undefined;

  for (const policy of policies) {
    if (!matchesPolicySubject(policy.subjectType, policy.attributes as Record<string, unknown> | null, input.subject, roles)) {
      continue;
    }

    if (!passesCondition(policy.condition as Record<string, unknown> | null | undefined, context)) {
      continue;
    }

    decision = policy.effect;
    logger.debug('Policy %s matched with effect %s', policy.id, policy.effect);
    if (policy.effect === PolicyEffect.DENY) {
      break;
    }
  }

  if (!decision) {
    logger.warn('No matching policy for %o', input);
    return false;
  }

  return decision === PolicyEffect.ALLOW;
};
