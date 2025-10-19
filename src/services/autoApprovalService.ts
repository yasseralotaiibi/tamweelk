import { Decision, DecisionStatus, RiskAssessment, CreditCheck } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yamljs';
import prisma from '../config/prisma';
import logger from '../config/logger';

export type AutoApprovalInput = {
  organizationId: string;
  userId: string;
  consentId?: string;
  riskAssessment: RiskAssessment;
  creditCheck: CreditCheck;
  amountSar?: number;
};

type ApprovalPolicy = {
  version: string;
  thresholds: {
    max_risk_score: number;
    min_credit_score: number;
    max_exposure_sar: number;
  };
  step_up: {
    trigger_risk_score: number;
    trigger_amount_sar: number;
    methods: string[];
  };
  rules: Array<{
    id: string;
    description: string;
    conditions: Record<string, unknown>;
    action: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
  }>;
};

let cachedPolicy: ApprovalPolicy | undefined;

const loadPolicy = async (): Promise<ApprovalPolicy> => {
  if (cachedPolicy) {
    return cachedPolicy;
  }

  const filePath = path.join(process.cwd(), 'config', 'approval-policies.yaml');
  const file = await fs.readFile(filePath, 'utf8');
  cachedPolicy = YAML.parse(file) as ApprovalPolicy;
  logger.info('Loaded approval policy version %s', cachedPolicy.version);
  return cachedPolicy;
};

const evaluateRule = (
  rule: ApprovalPolicy['rules'][number],
  riskAssessment: RiskAssessment,
  creditCheck: CreditCheck,
  amountSar = 0
): boolean => {
  const conditions = rule.conditions;
  if (conditions.risk_score_lte && riskAssessment.riskScore > Number(conditions.risk_score_lte)) {
    return false;
  }
  if (conditions.risk_score_gte && riskAssessment.riskScore < Number(conditions.risk_score_gte)) {
    return false;
  }
  if (conditions.credit_score_gte && creditCheck.simahScore < Number(conditions.credit_score_gte)) {
    return false;
  }
  if (conditions.risk_score_between) {
    const range = conditions.risk_score_between as { min: number; max: number };
    if (
      (range.min !== undefined && riskAssessment.riskScore < range.min) ||
      (range.max !== undefined && riskAssessment.riskScore > range.max)
    ) {
      return false;
    }
  }
  if (conditions.amount_lte && amountSar > Number(conditions.amount_lte)) {
    return false;
  }
  return true;
};

export const evaluateAutoApproval = async (
  input: AutoApprovalInput
): Promise<Decision> => {
  const policy = await loadPolicy();
  const { riskAssessment, creditCheck } = input;

  let status: DecisionStatus = DecisionStatus.MANUAL_REVIEW;
  let reason = 'Default manual review policy';
  let triggeredRule: string | undefined;

  const actionMap: Record<'APPROVE' | 'MANUAL_REVIEW' | 'REJECT', DecisionStatus> = {
    APPROVE: DecisionStatus.APPROVED,
    MANUAL_REVIEW: DecisionStatus.MANUAL_REVIEW,
    REJECT: DecisionStatus.REJECTED,
  };

  for (const rule of policy.rules) {
    if (evaluateRule(rule, riskAssessment, creditCheck, input.amountSar ?? 0)) {
      status = actionMap[rule.action];
      reason = rule.description;
      triggeredRule = rule.id;
      break;
    }
  }

  if (riskAssessment.riskScore > policy.thresholds.max_risk_score) {
    status = DecisionStatus.REJECTED;
    reason = 'Risk score exceeds policy threshold';
  }

  if (creditCheck.simahScore < policy.thresholds.min_credit_score) {
    status = DecisionStatus.REJECTED;
    reason = 'Credit score below policy minimum';
  }

  if (Number(creditCheck.exposureSar) > policy.thresholds.max_exposure_sar) {
    status = DecisionStatus.MANUAL_REVIEW;
    reason = 'Exposure exceeds automated approval ceiling';
  }

  const stepUpRequired =
    riskAssessment.riskScore >= policy.step_up.trigger_risk_score ||
    (input.amountSar ?? 0) >= policy.step_up.trigger_amount_sar;

  logger.info('Auto approval status %s (rule=%s)', status, triggeredRule);

  return prisma.decision.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      consentId: input.consentId,
      riskAssessmentId: riskAssessment.id,
      creditCheckId: creditCheck.id,
      status,
      riskScore: riskAssessment.riskScore,
      creditScore: creditCheck.simahScore,
      reason,
      metadata: {
        triggeredRule,
        policyVersion: policy.version,
        stepUpRequired,
        stepUpMethods: stepUpRequired ? policy.step_up.methods : [],
      },
    },
  });
};
