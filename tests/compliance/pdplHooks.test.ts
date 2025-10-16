import { mkdtemp, readFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import type { Consent } from '@prisma/client';

describe('PDPL compliance hooks', () => {
  let tmpDir: string;

  const loadModule = async () => import('../../src/compliance/pdplHooks');

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pdpl-hooks-'));
    process.env.PDPL_STORAGE_PATH = tmpDir;
    process.env.PDPL_ALLOWED_SCOPES = 'accounts.read payments.write';
    process.env.PDPL_SCOPE_LIMIT = '5';
    jest.resetModules();
  });

  afterEach(async () => {
    delete process.env.PDPL_STORAGE_PATH;
    delete process.env.PDPL_ALLOWED_SCOPES;
    delete process.env.PDPL_SCOPE_LIMIT;
    await rm(tmpDir, { recursive: true, force: true });
  });

  const buildConsent = (): Consent => ({
    id: 'consent-1',
    subject: 'user-123',
    purpose: 'account_information',
    scopes: ['accounts.read', 'accounts.read'],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    expiresAt: null,
    revokedAt: null
  });

  it('persists consent receipts with sanitised scopes', async () => {
    const { issueConsentReceipt } = await loadModule();
    const receipt = await issueConsentReceipt(buildConsent());

    expect(receipt.scopes).toEqual(['accounts.read']);

    const receiptFile = path.join(tmpDir, 'consent-receipts.jsonl');
    const content = await readFile(receiptFile, 'utf8');
    const savedReceipt = JSON.parse(content.trim());

    expect(savedReceipt).toMatchObject({
      consentId: 'consent-1',
      subject: 'user-123',
      purpose: 'account_information',
      scopes: ['accounts.read'],
      version: '1.0.0'
    });
    expect(typeof savedReceipt.recordedAt).toBe('string');
  });

  it('enforces PDPL scope minimisation policies', async () => {
    const { enforceDataMinimisation } = await loadModule();

    await expect(enforceDataMinimisation({ scopes: ['accounts.read'] })).resolves.toBeUndefined();
    await expect(
      enforceDataMinimisation({ scopes: ['accounts.read', 'payments.write'] })
    ).resolves.toBeUndefined();
    await expect(enforceDataMinimisation({ scopes: [] })).rejects.toThrow(
      'PDPL requires at least one consent scope.'
    );
    await expect(
      enforceDataMinimisation({ scopes: ['accounts.read', 'accounts.read'] })
    ).rejects.toThrow('Duplicate consent scopes violate PDPL minimisation policies.');
    await expect(
      enforceDataMinimisation({ scopes: ['accounts.read', 'transactions.read'] })
    ).rejects.toThrow('Disallowed consent scopes requested: transactions.read');

    process.env.PDPL_ALLOWED_SCOPES =
      'accounts.read payments.write extra.scope-1 extra.scope-2 extra.scope-3 extra.scope-4';
    await expect(
      enforceDataMinimisation({
        scopes: [
          'accounts.read',
          'payments.write',
          'extra.scope-1',
          'extra.scope-2',
          'extra.scope-3',
          'extra.scope-4'
        ]
      })
    ).rejects.toThrow('Requested consent scopes exceed PDPL limit of 5.');
  });

  it('records immutable audit log entries', async () => {
    const { recordImmutableAuditLog } = await loadModule();

    await recordImmutableAuditLog({ type: 'CONSENT_CREATED', metadata: { consentId: 'consent-1' } });

    const auditFile = path.join(tmpDir, 'pdpl-audit-log.jsonl');
    const content = await readFile(auditFile, 'utf8');
    const entry = JSON.parse(content.trim());

    expect(entry).toMatchObject({
      type: 'CONSENT_CREATED',
      metadata: { consentId: 'consent-1' }
    });
    expect(typeof entry.recordedAt).toBe('string');
  });
});
