import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import logger from '../config/logger';

export type ConsentReceiptPayload = {
  consentId: string;
  subjectId: string;
  scopes: string[];
  issuedAt: Date;
};

const DEFAULT_ALLOWED_SCOPES = [
  'accounts.read',
  'accounts.write',
  'payments.read',
  'payments.write',
  'transactions.read',
  'transactions.write',
  'beneficiaries.read',
  'beneficiaries.write',
  'fundsconfirmations.read'
];

const CONSENT_RECEIPTS_FILE = 'consent-receipts.jsonl';
const AUDIT_LOG_FILE = 'pdpl-audit-log.jsonl';
const CONSENT_RECEIPT_VERSION = '1.0.0';

const parseScopes = (raw: string | undefined): string[] => {
  if (!raw) {
    return DEFAULT_ALLOWED_SCOPES;
  }

  return raw
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
};

const getAllowedScopes = (): Set<string> => {
  return new Set(parseScopes(process.env.PDPL_ALLOWED_SCOPES));
};

const getStorageDirectory = (): string => {
  return process.env.PDPL_STORAGE_PATH || path.join(process.cwd(), 'var', 'pdpl');
};

const ensureStorageDirectory = async (): Promise<string> => {
  const directory = getStorageDirectory();
  await mkdir(directory, { recursive: true });
  return directory;
};

const appendJsonLine = async (fileName: string, payload: Record<string, unknown>): Promise<void> => {
  const directory = await ensureStorageDirectory();
  const filePath = path.join(directory, fileName);
  const line = `${JSON.stringify(payload)}\n`;
  await appendFile(filePath, line, { encoding: 'utf8' });
};

export const issueConsentReceipt = async (payload: ConsentReceiptPayload): Promise<void> => {
  logger.info('Issuing PDPL consent receipt %o', payload);

  const receipt = {
    consentId: payload.consentId,
    subjectId: payload.subjectId,
    scopes: Array.from(new Set(payload.scopes)).sort(),
    issuedAt: payload.issuedAt.toISOString(),
    version: CONSENT_RECEIPT_VERSION,
    recordedAt: new Date().toISOString()
  };

  await appendJsonLine(CONSENT_RECEIPTS_FILE, receipt);
};

export const assertDataMinimisation = (scopes: string[]): void => {
  logger.info('Validating data minimisation for scopes: %o', scopes);

  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new Error('At least one scope must be requested for consent.');
  }

  const uniqueScopes = new Set(scopes);
  if (uniqueScopes.size !== scopes.length) {
    throw new Error('Duplicate scopes are not permitted under PDPL minimisation policies.');
  }

  const allowedScopes = getAllowedScopes();
  const disallowedScopes = scopes.filter((scope) => !allowedScopes.has(scope));

  if (disallowedScopes.length > 0) {
    throw new Error(`Disallowed scopes requested: ${disallowedScopes.join(', ')}`);
  }

  const scopeLimit = Number(process.env.PDPL_SCOPE_LIMIT ?? '10');
  if (Number.isFinite(scopeLimit) && scopes.length > scopeLimit) {
    throw new Error(
      `Requested scopes exceed PDPL minimisation policy limit of ${scopeLimit} scopes.`
    );
  }
};

export const appendAuditTrail = async (
  event: string,
  metadata: Record<string, unknown>
): Promise<void> => {
  logger.info('Appending audit trail entry %s %o', event, metadata);

  const entry = {
    event,
    metadata,
    recordedAt: new Date().toISOString()
  };

  await appendJsonLine(AUDIT_LOG_FILE, entry);
};
