import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { dpopValidationMiddleware } from '../middleware/dpop';
import { jwtValidationMiddleware } from '../middleware/jwtAuth';
import { orgResolverMiddleware } from '../middleware/orgResolver';
import { evaluateAutoApproval } from '../services/autoApprovalService';
import prisma from '../config/prisma';
import { approvalDecisionSchema } from '../validators/schemas';
import { buildValidationErrorBody } from '../utils/validation';

const router = Router();

router.post(
  '/decide',
  dpopValidationMiddleware,
  jwtValidationMiddleware,
  orgResolverMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = approvalDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationErrorBody(parsed.errors));
      return;
    }
    const payload = parsed.data;
    if (!req.organization) {
      res.status(400).json({ error: 'Organization context missing' });
      return;
    }

    const riskAssessment = payload.riskAssessmentId
      ? await prisma.riskAssessment.findUnique({ where: { id: payload.riskAssessmentId } })
      : await prisma.riskAssessment.findFirst({
          where: { organizationId: req.organization.id, userId: payload.userId },
          orderBy: { createdAt: 'desc' },
        });

    if (!riskAssessment) {
      res.status(404).json({ error: 'Risk assessment not found' });
      return;
    }

    const creditCheck = payload.creditCheckId
      ? await prisma.creditCheck.findUnique({ where: { id: payload.creditCheckId } })
      : await prisma.creditCheck.findFirst({
          where: { organizationId: req.organization.id, userId: payload.userId },
          orderBy: { createdAt: 'desc' },
        });

    if (!creditCheck) {
      res.status(404).json({ error: 'Credit check not found' });
      return;
    }

    const decision = await evaluateAutoApproval({
      organizationId: req.organization.id,
      userId: payload.userId,
      consentId: payload.consentId,
      riskAssessment,
      creditCheck,
      amountSar: payload.amountSar,
    });

    res.json(decision);
  })
);

export default router;
