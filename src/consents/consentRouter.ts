import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { nonceValidationMiddleware } from '../middleware/nonce';
import { createConsent, listConsents, revokeConsent } from '../services/consentService';

const router = Router();

router.post(
  '/',
  jwtValidationMiddleware,
  nonceValidationMiddleware,
  asyncHandler(async (req, res) => {
    const { customerId, scopes, expiresAt, provider } = req.body;
    const consent = await createConsent({
      customerId,
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 3600 * 1000),
      provider: provider || 'demo-bank',
    });
    res.status(201).json(consent);
  })
);

router.get(
  '/',
  jwtValidationMiddleware,
  asyncHandler(async (req, res) => {
    const consents = await listConsents(req.query.customerId as string | undefined);
    res.json(consents);
  })
);

router.delete(
  '/:id',
  jwtValidationMiddleware,
  nonceValidationMiddleware,
  asyncHandler(async (req, res) => {
    const revoked = await revokeConsent(req.params.id);
    res.json(revoked);
  })
);

export default router;
