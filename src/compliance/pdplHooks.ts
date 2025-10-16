import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import logger from '../config/logger';
import { Consent } from '@prisma/client';

export interface ConsentReceipt {
  consentId: string;
  issuedAt: string;
  purpose: string;
  dataItems: string[];
  scopes: string[];
  subject: string;
  version: string;
  recordedAt: string;
}

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
    .split(/[\s,]+/)
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

const appendJsonLine = async (fileName: string, payload: unknown): Promise<void> => {
  const directory = await ensureStorageDirectory();
  const filePath = path.join(directory, fileName);
  const line = `${JSON.stringify(payload)}\n`;
  await appendFile(filePath, line, { encoding: 'utf8' });
};

export const issueConsentReceipt = async (consent: Consent): Promise<ConsentReceipt> => {
  const issuedAt = new Date().toISOString();
  const receipt: ConsentReceipt = {
    consentId: consent.id,
    subject: consent.subject,
    purpose: consent.purpose || 'account_information',
    dataItems: ['account_holder_name', 'iban', 'transaction_history'],
    scopes: Array.from(new Set(consent.scopes || [])).sort(),
    issuedAt,
    version: CONSENT_RECEIPT_VERSION,
    recordedAt: new Date().toISOString()
  };

  logger.info('pdpl:consent_receipt', receipt);
  await appendJsonLine(CONSENT_RECEIPTS_FILE, receipt);

  return receipt;
};

export const enforceDataMinimisation = async (payload: { scopes?: string[] }): Promise<void> => {
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes : [];

  logger.info('pdpl:data_minimisation_check', {
    requestedScopes: scopes,
    allowedScopes: Array.from(getAllowedScopes())
  });

  if (scopes.length === 0) {
    throw new Error('PDPL requires at least one consent scope.');
  }

  const uniqueScopes = new Set(scopes);
  if (uniqueScopes.size !== scopes.length) {
    throw new Error('Duplicate consent scopes violate PDPL minimisation policies.');
  }

  const allowedScopes = getAllowedScopes();
  const disallowed = scopes.filter((scope) => !allowedScopes.has(scope));
  if (disallowed.length > 0) {
    throw new Error(`Disallowed consent scopes requested: ${disallowed.join(', ')}`);
  }

  const scopeLimit = Number(process.env.PDPL_SCOPE_LIMIT ?? '10');
  if (Number.isFinite(scopeLimit) && scopes.length > scopeLimit) {
    throw new Error(`Requested consent scopes exceed PDPL limit of ${scopeLimit}.`);
  }
};

export const recordImmutableAuditLog = async (event: { type: string; metadata?: unknown }): Promise<void> => {
  const entry = {
    type: event.type,
    metadata: event.metadata,
    recordedAt: new Date().toISOString()
  };

  logger.info('pdpl:audit_log_entry', entry);
  await appendJsonLine(AUDIT_LOG_FILE, entry);
};
