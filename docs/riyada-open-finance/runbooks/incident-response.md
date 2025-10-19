# Incident Response Runbook

## Objectives
- Detect anomalous activity within 5 minutes via SIEM alerts.
- Contain high-severity incidents within 30 minutes.
- Restore service and validate integrity before closing the incident.

## Detection
1. Alerts originate from:
   - OpenTelemetry traces correlated to Nafath/SIMAH connectors.
   - WAF events exceeding 5 blocked requests per minute per IP.
   - Anomaly detection pipeline flagging token reuse or device drift.
2. Triage analyst validates alert fidelity via Grafana dashboard `Auth/Fraud`.

## Containment
1. Declare incident severity (P1-P3) and notify on-call engineer and compliance officer.
2. Enable feature flags to block affected scopes via `make deploy ENV=prod FEATURE=kill-switch`.
3. Rotate compromised credentials through Vault workflow (`vault write transit/rotate`).

## Eradication
1. Capture forensic snapshot:
   - `kubectl cp` container filesystem to isolated namespace.
   - Export audit logs to `/evidence/incidents/<id>/` with SHA-256 hash.
2. Patch vulnerable component or block exploit vector at API gateway.

## Recovery
1. Deploy clean build via GitHub Actions pipeline with evidence link to compliance pack.
2. Run smoke tests: `npm run test -- risk` and `make scan`.
3. Monitor error rate and latency for 30 minutes.

## Post-Incident
1. Complete post-mortem template within 48 hours including root cause, blast radius, remediation, and follow-up tickets.
2. Update risk register and residual risk in `/evidence/risk-register.xlsx`.
3. Share summary with regulatory liaison if incident impacts PDPL data subject rights.
