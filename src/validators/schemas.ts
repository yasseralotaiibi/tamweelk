import {
  array,
  boolean,
  enumeration,
  Infer,
  number,
  object,
  optional,
  string,
} from '../utils/schema';

const identifier = () => string({ minLength: 1 });

export const kycSubmitSchema = object({
  userId: identifier(),
  nationalId: string({ minLength: 5 }),
  documentNumber: string({ minLength: 3 }),
  documentType: enumeration(['national_id', 'iqama', 'passport'] as const),
  firstName: string({ minLength: 1 }),
  lastName: string({ minLength: 1 }),
});
export type KycSubmitInput = Infer<typeof kycSubmitSchema>;

export const kycRefreshSchema = object({
  reference: string({ minLength: 5 }),
});
export type KycRefreshInput = Infer<typeof kycRefreshSchema>;

export const kycWebhookSchema = object({
  organizationSlug: string({ minLength: 1 }),
  reference: string({ minLength: 1 }),
  status: enumeration(['VERIFIED', 'FAILED'] as const),
  pepFlag: optional(boolean()),
  sanctionsFlag: optional(boolean()),
});
export type KycWebhookInput = Infer<typeof kycWebhookSchema>;

export const riskScoreSchema = object({
  userId: identifier(),
  geoMismatch: optional(boolean()),
  pepHit: optional(boolean()),
  sanctionsHit: optional(boolean()),
  simahDelinquencyCount: optional(number({ min: 0, int: true })),
  exposureSar: optional(number({ min: 0 })),
  creditScore: optional(number({ min: 0 })),
  deviceTrusted: optional(boolean()),
  velocityAlerts: optional(number({ min: 0, int: true })),
  nafathRecentSuccess: optional(boolean()),
  consentAgeDays: optional(number({ min: 0, int: true })),
});
export type RiskScoreInput = Infer<typeof riskScoreSchema>;

export const creditCheckSchema = object({
  userId: identifier(),
  nationalId: string({ minLength: 5 }),
  purpose: string({ minLength: 3 }),
});
export type CreditCheckRequest = Infer<typeof creditCheckSchema>;

export const approvalDecisionSchema = object({
  userId: identifier(),
  consentId: optional(identifier()),
  riskAssessmentId: optional(identifier()),
  creditCheckId: optional(identifier()),
  amountSar: optional(number({ min: 0.01 })),
});
export type ApprovalDecisionInput = Infer<typeof approvalDecisionSchema>;

export const paymentInitiationSchema = object({
  userId: identifier(),
  amount: number({ positive: true }),
  currency: string({ pattern: /^[A-Za-z]{3}$/ }),
});
export type PaymentInitiationBody = Infer<typeof paymentInitiationSchema>;

export const consentCreateSchema = object({
  userId: identifier(),
  provider: optional(string({ minLength: 2 })),
  scopes: array(string({ minLength: 1 }), { minLength: 1 }),
  expiresAt: optional(string({ format: 'datetime' })),
});
export type ConsentCreateBody = Infer<typeof consentCreateSchema>;

export const consentQuerySchema = object({
  userId: optional(identifier()),
  status: optional(enumeration(['ACTIVE', 'REVOKED', 'EXPIRED'] as const)),
});
export type ConsentQuery = Infer<typeof consentQuerySchema>;

export const consentParamSchema = object({
  consentId: identifier(),
});
export type ConsentParam = Infer<typeof consentParamSchema>;
