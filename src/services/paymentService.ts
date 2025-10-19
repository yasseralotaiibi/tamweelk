import { PaymentIntent, PaymentStatus, RiskLevel, RiskAssessment } from '@prisma/client';
import prisma from '../config/prisma';

const scoreToRiskLevel = (score: number): RiskLevel => {
  if (score <= 30) return RiskLevel.LOW;
  if (score <= 60) return RiskLevel.MODERATE;
  if (score <= 85) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
};

export type PaymentInitiationInput = {
  organizationId: string;
  consentId: string;
  amount: number;
  currency: string;
  dpopThumbprint: string;
  riskAssessment: RiskAssessment;
  stepUpThreshold: number;
};

export const initiatePayment = async (
  input: PaymentInitiationInput
): Promise<PaymentIntent> => {
  const riskLevel = scoreToRiskLevel(input.riskAssessment.riskScore);
  const requiresStepUp = input.riskAssessment.riskScore >= input.stepUpThreshold;

  return prisma.paymentIntent.create({
    data: {
      organizationId: input.organizationId,
      consentId: input.consentId,
      amount: input.amount.toFixed(2),
      currency: input.currency,
      status: requiresStepUp ? PaymentStatus.REQUIRES_STEP_UP : PaymentStatus.INITIATED,
      riskLevel,
      dpopThumbprint: input.dpopThumbprint,
      stepUpRequired: requiresStepUp,
      metadata: {
        evaluatedAt: new Date().toISOString(),
        riskAssessmentId: input.riskAssessment.id,
      },
    },
  });
};
