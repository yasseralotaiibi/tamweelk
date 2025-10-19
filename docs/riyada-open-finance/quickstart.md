# Quickstart & Verification Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 18+
- pnpm or npm
- OpenSSL (for generating test certificates)

## Environment Setup
1. Copy `.env.example` to `.env` and adjust values.
2. Install dependencies and build TypeScript packages:
   ```bash
   pnpm install
   pnpm build
   ```

## Local Runtime (Sandbox)
```bash
make dev-stack
```
This command runs `docker-compose` bringing up Postgres, Redis, API gateway, auth server stubs, and developer portal. Logs are streamed via `docker compose logs -f`.

## Database
```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```
Migrations are transaction-safe; rollback script located under `prisma/migrations/rollback/`.

## Smoke Tests
```bash
pnpm test:smoke
```
Verifies health endpoint, KYC submission flow, risk scoring, and manual approval branch.

## Security Scans
```bash
make scan
```
Runs ESLint, dependency audit, SAST, and OPA policy checks. Build fails on any high severity finding.

## SBOM & Signing
```bash
make sbom
make sign
```
Generates CycloneDX SBOM and signs OCI image + SBOM with Sigstore `cosign`, storing attestations in `.attestations/`.

## Deployment (Blue/Green)
```bash
make deploy ENV=dev STRATEGY=bluegreen
```
Deploys via ArgoCD to the target namespace; verifies health checks before switching traffic. Automatic rollback occurs if health probes fail twice.

## Rollback
```bash
make rollback ENV=dev RELEASE=<release-id>
```
Reverts to previous signed artifact; verifies signature before rollout.

## Evidence Pack
```bash
make compliance-pack
```
Packages SoA, risk register, policies, audit logs, and attaches Terraform plan outputs.
