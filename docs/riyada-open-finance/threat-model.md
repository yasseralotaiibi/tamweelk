# Threat Model (STRIDE)

| Threat ID | STRIDE Category | Description | Impact | Likelihood | Mitigations | Residual Risk |
|-----------|-----------------|-------------|--------|------------|-------------|---------------|
| TM-01 | Spoofing | Compromised TPP attempts to impersonate another client using stolen credentials. | High | Medium | Mutual TLS at gateway, OAuth2 PAR/JAR, DPoP, client attestation, anomaly detection on client_id. | Low |
| TM-02 | Tampering | Attackers intercept consent decision payloads between services to alter risk score. | High | Low | mTLS, JWS signing of inter-service payloads, hash-based dynamic linking, integrity checks via audit log. | Low |
| TM-03 | Repudiation | TPP disputes consent creation or deletion action. | Medium | Medium | Immutable audit trail (WORM), JWS consent receipts, blockchain hash ledger, trace IDs logged. | Low |
| TM-04 | Information Disclosure | Unauthorized user accesses PII or SIMAH credit data. | Critical | Medium | FGA + ABAC, row-level security, encryption at rest, vault-managed secrets, Just-in-time access reviews. | Low |
| TM-05 | Denial of Service | Botnet floods /v1/kyc/submit causing service exhaustion. | High | Medium | API gateway rate limiting, adaptive risk-based throttling, autoscaling, WAF with anomaly detection. | Medium |
| TM-06 | Elevation of Privilege | Internal operator escalates privileges to approve high-risk transactions. | High | Low | Segregation of duties, privileged access management, step-up via Absher, continuous access review, policy-as-code checks. | Low |
| TM-07 | Supply Chain | Dependency compromise introduces malicious code into CI pipeline. | High | Medium | Sigstore verification, lockfiles, SCA scanning, notarized builds, reproducible builds, dependency allowlist. | Low |
| TM-08 | Replay | Adversary reuses old Nafath callback with valid consent_id. | Medium | Medium | Nonce validation, timestamp checks, binding to session, short TTL, event deduplication via idempotency keys. | Low |
| TM-09 | Insider Threat | Developer extracts production database backup. | High | Low | Encryption with key escrow, monitored admin actions, zero-trust access proxies, regular audits, honeytoken detection. | Medium |
| TM-10 | Privacy Breach | PDPL DSAR not honored causing regulatory penalties. | High | Low | Automated DSAR workflows, SLA monitoring, evidence logging, compliance dashboard alerts. | Low |

## Additional Mitigation Notes
- **Secure Defaults**: Services enforce strict schema validation (Zod + JSON Schema) and reject unknown fields.
- **Observability**: All requests include traceparent and consent_id correlation enabling rapid forensic analysis.
- **Incident Response**: Playbooks ensure containment within 30 minutes and MTTR under 2 hours.
- **Chaos Testing**: Regular failure injection validates resilience of retries, circuit breakers, and fallback flows.
