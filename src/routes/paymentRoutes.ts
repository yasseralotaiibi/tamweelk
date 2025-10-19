import { Router, RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { dpopValidationMiddleware } from '../middleware/dpop';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { orgResolverMiddleware } from '../middleware/orgResolver';
import { fgaMiddleware } from '../middleware/fga';
import prisma from '../config/prisma';
import { initiatePayment } from '../services/paymentService';
import {
  paymentInitiationSchema,
  consentParamSchema,
} from '../validators/schemas';
import { buildValidationErrorBody } from '../utils/validation';

const validateConsentParam: RequestHandler = (req, res, next) => {
  const parsed = consentParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json(buildValidationErrorBody(parsed.errors));
    return;
  }
  req.params.consentId = parsed.data.consentId;
  next();
};

const router = Router();

router.post(
  '/:consentId/initiate',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  validateConsentParam,
  fgaMiddleware({
    action: 'payments:initiate',
    resourceType: 'consent',
    resourceIdResolver: (req) => req.params.consentId,
    contextResolver: (req) => ({ riskScore: Number(req.headers['x-risk-score'] ?? 0) }),
  }),
  asyncHandler(async (req, res) => {
    const parsedBody = paymentInitiationSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json(buildValidationErrorBody(parsedBody.errors));
      return;
    }
    const payload = parsedBody.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const consent = await prisma.consent.findFirst({
      where: { id: req.params.consentId, organizationId: req.organization.id },
    });

    if (!consent) {
      res.status(404).json({ error: 'Consent not found' });
      return;
    }

    const riskAssessment = await prisma.riskAssessment.findFirst({
      where: { organizationId: req.organization.id, userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!riskAssessment) {
      res.status(404).json({ error: 'Risk assessment not found for user' });
      return;
    }

    if (!req.dpop) {
      res.status(400).json({ error: 'DPoP context missing' });
      return;
    }

    const intent = await initiatePayment({
      organizationId: req.organization.id,
      consentId: consent.id,
      amount: payload.amount,
      currency: payload.currency.toUpperCase(),
      dpopThumbprint: req.dpop.thumbprint,
      riskAssessment,
      stepUpThreshold: req.organization.riskThreshold,
    });

    res.status(201).json(intent);
  })
);

export default router;
