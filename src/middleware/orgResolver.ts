import { NextFunction, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import type { AuthenticatedRequest } from './jwtAuth';

export const orgResolverMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const headerOrgId = req.headers['x-org-id'] as string | undefined;
  const headerOrgSlug = req.headers['x-org-slug'] as string | undefined;
  const tokenOrgId = (req.user?.org_id as string | undefined) ?? undefined;
  const tokenOrgSlug = (req.user?.org_slug as string | undefined) ?? undefined;

  const orConditions = [
    headerOrgId ? { id: headerOrgId } : null,
    tokenOrgId ? { id: tokenOrgId } : null,
    headerOrgSlug ? { slug: headerOrgSlug } : null,
    tokenOrgSlug ? { slug: tokenOrgSlug } : null,
  ].filter(Boolean) as Array<{ id?: string; slug?: string }>;

  if (orConditions.length === 0) {
    res.status(400).json({ error: 'Organization context required' });
    return;
  }

  const organization = await prisma.organization.findFirst({
    where: { OR: orConditions.length > 0 ? orConditions : undefined },
    include: { tenantSettings: true },
  });

  if (!organization) {
    logger.warn('Organization context missing for headers %s %s', headerOrgId, headerOrgSlug);
    res.status(400).json({ error: 'Organization context required' });
    return;
  }

  req.organization = {
    id: organization.id,
    slug: organization.slug,
    riskThreshold: organization.tenantSettings?.riskThreshold ?? 70,
    defaultAcr: organization.tenantSettings?.defaultAcr ?? 'loa2',
  };

  if (req.user?.sub) {
    const roles = await prisma.userOrg.findMany({
      where: { organizationId: organization.id, userId: req.user.sub },
      select: { role: true },
    });
    req.subjectRoles = roles.map((role) => role.role);
  }

  next();
};
