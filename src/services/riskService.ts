import { RiskAssessment, RiskLevel } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yamljs';
import prisma from '../config/prisma';
import logger from '../config/logger';

export type RiskEvaluationInput = {
  organizationId: string;
  userId: string;
  geoMismatch?: boolean;
  pepHit?: boolean;
  sanctionsHit?: boolean;
  simahDelinquencyCount?: number;
  exposureSar?: number;
  creditScore?: number;
  deviceTrusted?: boolean;
  velocityAlerts?: number;
  nafathRecentSuccess?: boolean;
  consentAgeDays?: number;
};

type RiskConfig = {
  version: string;
  weights: Record<string, number>;
  controls: {
    base_score: number;
    nafath_recent_success?: number;
    consent_age_days_reduction?: {
      threshold: number;
      reduction: number;
    };
  };
};

let cachedConfig: RiskConfig | undefined;

const loadRiskConfig = async (): Promise<RiskConfig> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'risk-rules.yaml');
  const fileContent = await fs.readFile(configPath, 'utf8');
  cachedConfig = YAML.parse(fileContent) as RiskConfig;
  logger.info('Loaded risk configuration version %s', cachedConfig.version);
  return cachedConfig;
};

const scoreToLevel = (score: number): RiskLevel => {
  if (score <= 30) return RiskLevel.LOW;
  if (score <= 60) return RiskLevel.MODERATE;
  if (score <= 85) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
};

export const evaluateRisk = async (
  input: RiskEvaluationInput
): Promise<RiskAssessment> => {
  const config = await loadRiskConfig();
  let score = config.controls.base_score;
  const ruleHits: string[] = [];

  if (input.geoMismatch) {
    score += config.weights.geo_mismatch ?? 0;
    ruleHits.push('geo_mismatch');
  }

  if (input.pepHit) {
    score += config.weights.pep_hit ?? 0;
    ruleHits.push('pep_hit');
  }

  if (input.sanctionsHit) {
    score += config.weights.sanctions_hit ?? 0;
    ruleHits.push('sanctions_hit');
  }

  if ((input.simahDelinquencyCount ?? 0) > 0) {
    score += config.weights.simah_delinquency ?? 0;
    ruleHits.push('simah_delinquency');
  }

  if ((input.exposureSar ?? 0) > 100000) {
    score += config.weights.high_exposure ?? 0;
    ruleHits.push('high_exposure');
  }

  if ((input.creditScore ?? 0) < 650) {
    score += config.weights.low_credit_score ?? 0;
    ruleHits.push('low_credit_score');
  }

  if (input.deviceTrusted === false) {
    score += config.weights.device_untrusted ?? 0;
    ruleHits.push('device_untrusted');
  }

  if ((input.velocityAlerts ?? 0) > 0) {
    score += config.weights.velocity_alert ?? 0;
    ruleHits.push('velocity_alert');
  }

  if (input.nafathRecentSuccess) {
    score += config.controls.nafath_recent_success ?? 0;
    ruleHits.push('nafath_recent_success');
  }

  if ((input.consentAgeDays ?? 0) <= (config.controls.consent_age_days_reduction?.threshold ?? 0)) {
    score -= config.controls.consent_age_days_reduction?.reduction ?? 0;
    ruleHits.push('consent_age_bonus');
  }

  score = Math.max(score, 0);
  const riskLevel = scoreToLevel(score);

  logger.info('Risk evaluation for %s -> %d (%s)', input.userId, score, riskLevel);

  return prisma.riskAssessment.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      riskScore: Math.round(score),
      riskLevel,
      ruleHits,
      context: {
        ...input,
        evaluatedAt: new Date().toISOString(),
        version: config.version,
      },
    },
  });
};
