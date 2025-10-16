import { mkdtemp, readFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

describe('PDPL utilities', () => {
  let tmpDir: string;

  const loadPdplModule = async () => {
    return import('../../src/utils/pdpl');
  };

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pdpl-test-'));
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

  it('persists consent receipts as JSON lines', async () => {
    const { issueConsentReceipt } = await loadPdplModule();

    const issuedAt = new Date('2024-01-01T00:00:00.000Z');

    await issueConsentReceipt({
      consentId: 'consent-123',
      subjectId: 'user-456',
      scopes: ['accounts.read', 'accounts.read'],
      issuedAt
    });

    const receiptFile = path.join(tmpDir, 'consent-receipts.jsonl');
    const content = await readFile(receiptFile, 'utf8');
    const [firstLine] = content.trim().split('\n');
    const payload = JSON.parse(firstLine);

    expect(payload).toMatchObject({
      consentId: 'consent-123',
      subjectId: 'user-456',
      scopes: ['accounts.read'],
      issuedAt: issuedAt.toISOString(),
      version: '1.0.0'
    });
    expect(typeof payload.recordedAt).toBe('string');
  });

  it('enforces scope minimisation policies', async () => {
    const { assertDataMinimisation } = await loadPdplModule();

    expect(() => assertDataMinimisation(['accounts.read'])).not.toThrow();
    expect(() => assertDataMinimisation(['payments.write', 'accounts.read'])).not.toThrow();
    expect(() => assertDataMinimisation(['transactions.read'])).toThrow(
      'Disallowed scopes requested: transactions.read'
    );
    expect(() => assertDataMinimisation(['accounts.read', 'accounts.read'])).toThrow(
      'Duplicate scopes are not permitted under PDPL minimisation policies.'
    );
    expect(() => assertDataMinimisation(['accounts.read', 'payments.write', 'extra.scope'])).toThrow(
      'Disallowed scopes requested: extra.scope'
    );

    process.env.PDPL_ALLOWED_SCOPES =
      'accounts.read payments.write scope-3 scope-4 scope-5 scope-6';
    expect(() =>
      assertDataMinimisation(['accounts.read', 'payments.write', 'scope-3', 'scope-4', 'scope-5', 'scope-6'])
    ).toThrow('Requested scopes exceed PDPL minimisation policy limit of 5 scopes.');
  });

  it('writes audit trail entries', async () => {
    const { appendAuditTrail } = await loadPdplModule();

    await appendAuditTrail('CONSENT_CREATED', { consentId: 'consent-999' });

    const auditFile = path.join(tmpDir, 'pdpl-audit-log.jsonl');
    const content = await readFile(auditFile, 'utf8');
    const entry = JSON.parse(content.trim());

    expect(entry).toMatchObject({
      event: 'CONSENT_CREATED',
      metadata: { consentId: 'consent-999' }
    });
    expect(typeof entry.recordedAt).toBe('string');
  });
});
