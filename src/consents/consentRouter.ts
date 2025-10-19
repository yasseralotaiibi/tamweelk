import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { dpopValidationMiddleware } from '../middleware/dpop';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { orgResolverMiddleware } from '../middleware/orgResolver';
import { nonceValidationMiddleware } from '../middleware/nonce';
import { createConsent, listConsents, revokeConsent } from '../services/consentService';
import { checkAccess } from '../services/fgaService';
import { consentCreateSchema, consentQuerySchema } from '../validators/schemas';
import { buildValidationErrorBody } from '../utils/validation';

const router = Router();

router.post(
  '/',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  nonceValidationMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = consentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const consent = await createConsent({
      organizationId: req.organization.id,
      userId: payload.userId,
      provider: payload.provider ?? 'demo-bank',
      scopes: payload.scopes,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : new Date(Date.now() + 3600 * 1000),
    });

    res.status(201).json(consent);
  })
);

router.get(
  '/',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  asyncHandler(async (req, res) => {
    const parsedQuery = consentQuerySchema.safeParse(req.query as Record<string, unknown>);
    if (!parsedQuery.success) {
      res.status(400).json(buildValidationErrorBody(parsedQuery.errors));
      return;
    }
    const query = parsedQuery.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const consents = await listConsents(req.organization.id, {
      userId: query.userId,
      status: query.status,
    });

    const authorizedConsents = [];
    for (const consent of consents) {
      const allowed = await checkAccess({
        organizationId: req.organization.id,
        subject: {
          id: (req.user?.sub as string) ?? 'anonymous',
          type: req.user?.sub ? 'user' : 'service',
          roles: req.subjectRoles,
        },
        action: 'consent:read',
        resourceType: 'consent',
        resourceId: consent.id,
        context: { riskScore: 0 },
      });
      if (allowed) {
        authorizedConsents.push(consent);
      }
    }

    res.json(authorizedConsents);
  })
);

router.delete(
  '/:id',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  nonceValidationMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const allowed = await checkAccess({
      organizationId: req.organization.id,
      subject: {
        id: (req.user?.sub as string) ?? 'anonymous',
        type: req.user?.sub ? 'user' : 'service',
        roles: req.subjectRoles,
      },
      action: 'consent:revoke',
      resourceType: 'consent',
      resourceId: req.params.id,
      context: {},
    });

    if (!allowed) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const revoked = await revokeConsent(req.organization.id, req.params.id);
    res.json(revoked);
  })
);

export default router;
