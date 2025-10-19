import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { dpopValidationMiddleware } from '../middleware/dpop';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { orgResolverMiddleware } from '../middleware/orgResolver';
import { evaluateRisk } from '../services/riskService';
import { riskScoreSchema } from '../validators/schemas';
import { buildValidationErrorBody } from '../utils/validation';

const router = Router();

router.post(
  '/score',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = riskScoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const assessment = await evaluateRisk({
      organizationId: req.organization.id,
      userId: payload.userId,
      geoMismatch: payload.geoMismatch,
      pepHit: payload.pepHit,
      sanctionsHit: payload.sanctionsHit,
      simahDelinquencyCount: payload.simahDelinquencyCount,
      exposureSar: payload.exposureSar,
      creditScore: payload.creditScore,
      deviceTrusted: payload.deviceTrusted,
      velocityAlerts: payload.velocityAlerts,
      nafathRecentSuccess: payload.nafathRecentSuccess,
      consentAgeDays: payload.consentAgeDays,
    });

    res.json(assessment);
  })
);

export default router;
