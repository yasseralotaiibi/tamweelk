import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { dpopValidationMiddleware } from '../middleware/dpop';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { orgResolverMiddleware } from '../middleware/orgResolver';
import { performCreditCheck } from '../services/creditService';
import { creditCheckSchema } from '../validators/schemas';
import { buildValidationErrorBody } from '../utils/validation';

const router = Router();

router.post(
  '/check',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = creditCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const report = await performCreditCheck({
      organizationId: req.organization.id,
      userId: payload.userId,
      nationalId: payload.nationalId,
      purpose: payload.purpose,
    });

    res.json(report);
  })
);

export default router;
