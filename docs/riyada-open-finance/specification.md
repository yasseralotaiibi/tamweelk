# Functional & Non-Functional Specification

## Product Brief
Riyada Open Finance provides secure consent-driven APIs for KYC verification, risk scoring, credit assessment, and automated approval decisions aligned with SAMA open banking regulations. The platform exposes REST APIs, webhook callbacks, and developer tooling enabling regulated TPPs to integrate identity verification and credit decisioning into their products.

## User Stories & Acceptance Criteria

| ID | Role | Story | Acceptance Criteria |
|----|------|-------|---------------------|
| US-01 | TPP Developer | As a developer, I want to register my application and obtain credentials so that I can access sandbox APIs. | OAuth2 client registration requires Nafath verified operator, manual approval for production, API key issuance logged, credentials retrievable only via secure portal. |
| US-02 | End User | As a consumer, I want to consent to sharing my banking data with a TPP so that services can personalize offers. | Consent screen displays scopes, validity, lawful basis; JWS receipt generated; revocation endpoint updates state within 5 seconds. |
| US-03 | Compliance Officer | As compliance, I want an audit trail of all consents and approvals so that we can respond to regulators. | Audit events captured with trace ID, actor, timestamp; immutable storage; SoA export produced on demand. |
| US-04 | Risk Analyst | As risk, I want to configure risk rules and thresholds so that auto approvals are consistent. | `config/risk-rules.yaml` editable with validation; changes tracked via Git; policy deployment logged; risk scores recalculated per request. |
| US-05 | TPP Backend | As an API consumer, I want to initiate an auto-approval decision so that I can onboard customers instantly. | Endpoint `/v1/approval/decide` accepts idempotency key; returns decision within 400ms P95; manual review reason codes provided. |
| US-06 | DPO | As a privacy officer, I need DSAR endpoints so that data subjects can access or delete their data. | `/v1/me/data/export`, `/v1/me/data/delete`, `/v1/me/consents` implement authentication, tracking, SLA metrics, and compliance evidence. |

## Non-Functional Requirements
- **Performance**: P95 latency ≤ 250 ms for core APIs; throughput 10k RPS with autoscaling; memory usage < 512MB per pod.
- **Availability**: 99.9% uptime; RPO ≤5 minutes; RTO ≤30 minutes; multi-AZ Postgres and Redis cluster.
- **Security**: OAuth2/OIDC with PKCE, DPoP, mTLS; RBAC + ABAC via OPA; encryption at rest (AES-256) and in transit (TLS1.3); secrets managed in Vault.
- **Compliance**: ISO 27001, SOC 2, SAMA CSF, PDPL; evidence stored in `/evidence`; DSAR automation; DPIA required for new data flows.
- **Observability**: OpenTelemetry instrumentation for traces, metrics, logs; Grafana dashboards for RED/USE metrics; alerts for SLO burn-rate.
- **Scalability**: Horizontal autoscaling with HPA; partitioned Postgres tables; read replicas for analytics; queue-based workload decoupling.
- **Reliability**: Circuit breakers, retries with exponential backoff + jitter, bulkhead isolation, chaos testing schedule.
- **Maintainability**: Modular hexagonal architecture; TypeScript strict mode; linting (ESLint/Prettier); unit test coverage ≥80%.

## API Principles
- Versioned base path `/v1` with roadmap for `/v2`.
- Cursor-based pagination; include `next_cursor` header.
- Problem Details (RFC 7807) for errors with `trace_id` and unique error codes.
- Security headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Rate limiting per subject and API key; 429 responses include `Retry-After`.

## Business Rules
- Idempotency key required for POST operations; deduplicated for 24 hours in Redis.
- Auto approval granted when risk score ≤ 40 and credit score ≥ 680; otherwise manual review; override requires dual authorization.
- Consent validity maximum 90 days; refresh requires user confirmation via Nafath.
- DSAR requests prioritized; failure to meet SLA triggers PagerDuty alert and compliance ticket.

## Domain Entities
- **User**: end user with personal data, multi-tenant membership.
- **Organization**: TPP or internal business unit with policies and quotas.
- **Consent**: scope, status, expiry, JWS receipt, lawful basis.
- **KycRecord**: verification status, documents, PEP/sanctions flags.
- **RiskEvaluation**: contextual risk score, reasons, device info.
- **CreditCheck**: SIMAH score, delinquency, exposure.
- **Decision**: auto-approval outcome, risk reasons, audit reference.

## Assumptions
- Sandbox environment simulates Nafath/Absher/SIMAH via deterministic adapters.
- Multi-tenancy enforced via schema separation and row-level security.
- Kafka is used for audit/event streaming but can be replaced with SNS/SQS if required.
