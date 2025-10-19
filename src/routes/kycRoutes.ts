import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { dpopValidationMiddleware } from '../middleware/dpop';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { orgResolverMiddleware } from '../middleware/orgResolver';
import { submitKyc, refreshKycStatus, upsertWebhookKyc } from '../services/kycService';
import prisma from '../config/prisma';
import {
  kycSubmitSchema,
  kycRefreshSchema,
  kycWebhookSchema,
} from '../validators/schemas';
import { buildValidationErrorBody } from '../utils/validation';

const router = Router();

router.post(
  '/submit',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = kycSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const record = await submitKyc({
      organizationId: req.organization.id,
      userId: payload.userId,
      nationalId: payload.nationalId,
      documentNumber: payload.documentNumber,
      documentType: payload.documentType,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    res.status(202).json(record);
  })
);

router.post(
  '/refresh',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = kycRefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const record = await refreshKycStatus(req.organization.id, payload.reference);
    res.json(record);
  })
);

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const parsed = kycWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    const organization = await prisma.organization.findUnique({
      where: { slug: payload.organizationSlug },
    });
    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const record = await upsertWebhookKyc(organization.id, payload);
    res.json(record);
  })
);

export default router;
