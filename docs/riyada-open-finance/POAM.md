# Plan of Action and Milestones (POAM)

| Task ID | Description | Owner | Dependencies | Estimate | Status | Notes |
|---------|-------------|-------|--------------|----------|--------|-------|
| POAM-01 | Establish baseline repository structure for the Riyada Open Finance platform and initialize compliance artefacts. | Platform Lead | None | 2d | Planned | Includes directory scaffolding and documentation seeds. |
| POAM-02 | Design target-state architecture diagrams (context, container, component, sequence) aligned with zero-trust controls. | Security Architect | POAM-01 | 3d | In Progress | Use Mermaid + ASCII for portability. |
| POAM-03 | Draft threat model and STRIDE analysis covering KYC, risk, credit, and auto-approval flows. | Security Architect | POAM-02 | 2d | Planned | Document mitigations and residual risks. |
| POAM-04 | Produce functional & non-functional specifications including PDPL/GDPR mapping. | Product Owner | POAM-02 | 3d | Planned | Capture user stories, NFRs, service-level targets. |
| POAM-05 | Define OpenAPI/JSON Schemas and event contracts for consent, KYC, risk, and credit services. | API Engineer | POAM-04 | 4d | Planned | Ensure RFC 7807 error model and cursor pagination. |
| POAM-06 | Implement backend service skeleton with security middlewares, DTOs, and repository interfaces. | Backend Lead | POAM-05 | 6d | Not Started | Node.js (TypeScript) + Fastify + Prisma/Postgres. |
| POAM-07 | Implement frontend developer portal skeleton with Tailwind, React Query, and secure auth flows. | Frontend Lead | POAM-06 | 6d | Not Started | Include consent dashboard and sandbox tooling. |
| POAM-08 | Author Terraform baseline for network, Postgres, Redis, Vault, and Kubernetes clusters. | DevOps Lead | POAM-06 | 5d | Not Started | Cover dev/stage/prod with remote state. |
| POAM-09 | Configure CI/CD pipelines for tests, security scans, SBOM, and signed artifact publishing. | DevOps Lead | POAM-06 | 4d | Not Started | GitHub Actions matrix for unit/integration/security tests. |
| POAM-10 | Draft runbooks, incident response plans, DR/BCP documentation, and compliance evidence mapping. | Compliance Lead | POAM-03 | 4d | Planned | Include SoA and DPIA templates. |
| POAM-11 | Develop observability stack (OpenTelemetry Collector, Grafana dashboards, alert rules). | SRE Lead | POAM-06 | 5d | Not Started | Provide dashboards and burn-rate alerts. |
| POAM-12 | Deliver verify_release.sh and make compliance-pack automation. | Release Manager | POAM-09 | 3d | Not Started | Integrate cosign signatures and CycloneDX SBOM. |
| POAM-13 | Execute smoke tests, performance baseline, and chaos experiments in staging. | QA Lead | POAM-06 | 5d | Not Started | Include k6, ZAP, fuzzing, and chaos plans. |
| POAM-14 | Prepare executive compliance dashboard and auditor interface with signed evidence downloads. | Compliance Lead | POAM-10 | 5d | Planned | Align with ISO 27001, SOC 2, SAMA CSF. |
| POAM-15 | Finalize knowledge transfer package, onboarding guide, and release notes for launch readiness. | Program Manager | POAM-14 | 2d | Planned | Consolidate in /handbook and /docs. |

## Milestone Summary

1. **Foundation (Week 1–2)** – Repo scaffolding, architecture, threat modeling, specifications.
2. **Build (Week 3–6)** – Backend, frontend, IaC, observability, CI/CD.
3. **Assurance (Week 7–8)** – Testing, compliance evidence, audits, verification scripts.
4. **Launch (Week 9)** – Final reviews, documentation, handover, release operations.
