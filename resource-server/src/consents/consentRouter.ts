import { Router, Request, Response } from 'express';
import jwtValidationMiddleware from '../middleware/jwtMiddleware';
import nonceValidationMiddleware from '../middleware/nonceMiddleware';
import { createConsent, listConsents, revokeConsent } from './consentService';

const router = Router();

router.post('/consents', jwtValidationMiddleware, nonceValidationMiddleware, async (req: Request, res: Response) => {
  const { subject, purpose, scopes, expires_at: expiresAt } = req.body || {};

  if (!subject || !purpose || !Array.isArray(scopes)) {
    return res.status(400).json({ error: 'subject, purpose and scopes[] are required' });
  }

  const result = await createConsent({ subject, purpose, scopes, expiresAt });
  return res.status(201).json({ consent: result.consent, receipt_id: result.receiptId });
});

router.get('/consents', jwtValidationMiddleware, async (_req: Request, res: Response) => {
  const consents = await listConsents();
  return res.json({ consents });
});

router.delete('/consents/:id', jwtValidationMiddleware, nonceValidationMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const consent = await revokeConsent(id);

  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }

  return res.json({ consent });
});

export default router;
