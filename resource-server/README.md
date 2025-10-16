# Riyada Open Banking MVP

Riyada Open Banking MVP is a developer-first scaffold for building Saudi Central Bank (SAMA) compliant Open Banking solutions.
It demonstrates mocked FAPI Advanced + CIBA login flows, consent management, and national ecosystem integrations (Nafath, Absher, SIMAH) with PDPL-ready compliance hooks.

## Highlights

- **Consent-as-a-Service** with mocked CIBA decoupled authentication and consent APIs.
- **Security-first posture** leveraging JWT validation, nonce enforcement, mTLS/JWS placeholders, Helmet and rate limiting.
- **Compliance scaffolding** for PDPL consent receipts, audit logs, and data minimisation checks.
- **Developer experience** with Swagger UI, Jest test skeletons, and a static demo frontend for walkthroughs.
- **Modern stack** built on TypeScript, Express, Prisma (Postgres), and Redis.

## Project Structure

```
openbanking-mvp/
├── src/
│   ├── auth/              # Mocked CIBA flow controllers and services
│   ├── consents/          # Consent CRUD services and routes
│   ├── connectors/        # Stubs for Nafath, Absher, SIMAH integrations
│   ├── compliance/        # PDPL compliance hooks
│   ├── middleware/        # JWT, nonce, rate limiting middleware
│   ├── config/            # Environment, Prisma, Redis, logging utilities
│   ├── audit/             # Audit log persistence helpers
│   └── app.ts             # Express app bootstrap
├── docs/                  # OpenAPI specification and documentation
├── public/                # Static consent demo UI
├── prisma/                # Prisma schema and seed script
├── tests/                 # Jest-based test skeletons
├── Dockerfile             # API container image
├── docker-compose.yml     # API + Postgres + Redis stack
├── package.json           # NPM scripts and dependencies
└── README.md              # This guide
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Docker (optional but recommended for full stack)

### Environment Variables

Copy `.env.example` into `.env` and adjust values if needed:

```
cp .env.example .env
```

## Setup & Usage

```bash
# Clone repo
git clone <repo-url>
cd openbanking-mvp

# Install deps
npm install

# Run in dev mode
npm run dev

# Run dockerized stack
docker-compose up --build

# Run tests
npm run test

# View API docs
http://localhost:3000/docs
```

### Available NPM Scripts

- `npm run dev` – Run the API with `ts-node-dev` and live reload.
- `npm run build` – Compile TypeScript into JavaScript (`dist/`).
- `npm run start` – Serve the compiled API from `dist/`.
- `npm run lint` – Lint using ESLint + Prettier rules.
- `npm run test` – Execute Jest tests and skeleton suites.
- `npm run prisma:generate` – Generate Prisma client.
- `npm run prisma:migrate` – Create development migrations.
- `npm run prisma:seed` – Seed Postgres with demo data.

### API Overview

- `POST /api/ciba/auth/request` – Create a mocked CIBA authentication request.
- `POST /api/ciba/auth/token` – Poll for decoupled authentication results.
- `POST /api/mock/nafath/approve|deny` – Simulate Nafath push outcomes.
- `POST /api/consents` – Create PDPL-compliant consent records.
- `GET /api/consents` – List consents for review.
- `DELETE /api/consents/{id}` – Revoke a consent and issue audit logs.

Swagger UI is available at `http://localhost:3000/docs` and renders the OpenAPI specification stored in `docs/openapi.yaml`.

### Security & Compliance Placeholders

- **mTLS Enforcement** – Use an API gateway or reverse proxy to enforce client certificate validation (placeholder documented in `src/config/env.ts`).
- **JWS Signing** – Hook into response serialization to sign payloads using SAMA-approved keys (placeholder logged via Winston).
- **JWT Validation** – `src/middleware/jwtMiddleware.ts` demonstrates bearer token verification with configurable issuer/audience.
- **Nonce Enforcement** – `src/middleware/nonceMiddleware.ts` prevents replay attacks using Redis.
- **PDPL Hooks** – `src/compliance/pdplHooks.ts` issues consent receipts and logs minimisation checks.
- **Audit Logging** – `src/audit/auditService.ts` persists immutable audit events to Postgres.

### Running with Docker

`docker-compose.yml` provisions:

- **api** – Node.js service running the Express API.
- **postgres** – Postgres 15 instance for Prisma models.
- **redis** – Redis 7 instance for nonce/auth state.

To launch the full stack:

```
docker-compose up --build
```

After containers start, run Prisma migrations and seed data inside the API container:

```
docker-compose exec api npm run prisma:generate
docker-compose exec api npm run prisma:migrate -- --name init
docker-compose exec api npm run prisma:seed
```

### Developer Frontend Demo

Navigate to `http://localhost:3000` to explore the static HTML demo. It walks through the mocked CIBA login, Nafath approval, token polling, and consent issuance flow end-to-end.

## Next Steps

- Replace mocked connectors with live integrations to Nafath, Absher, and SIMAH.
- Integrate with an HSM/KMS for JWS signing and secure key custody.
- Harden JWT validation with JWKS retrieval and certificate pinning.
- Extend audit logging to push events into a tamper-evident ledger (e.g., QLDB or blockchain).
- Implement full AIS/PIS scopes and consent statuses as defined by SAMA.

## License

Licensed under the Apache 2.0 License. See [LICENSE](../LICENSE.md) for details.

# Django, React, Vite & Tailwind CSS Template

This is a starter template for building a full stack Django, React, Vite & Tailwind CSS Template on [Coherence](withcoherence.com).

## How to use

1. Sign up for an account at [app.withcoherence.com](https://app.withcoherence.com/)
2. Once you have created an account, create a new application.
3. On the "App details" page, inside step #2 "Import a repo," click on the "Import feature" link to import a repo into your GitHub account.
4. Copy and paste this repo's URL `https://github.com/coherenceplatform/django-react-tailwind-template` into the "Your old repository’s clone URL" field.
5. Give your new repo a name and then click the "Begin import" button.
6. After the repo has imported, copy and paste the new repo's URL into the "Repo URL" field in Coherence.
7. Follow the remaining onboarding instructions.

Coherence will set up your Cloud IDE, automatic preview environments, CI/CD pipelines, and managed cloud infrastructure.


# Django, React, Vite & Tailwind CSS Template

This is a starter template for building a full stack Django, React, Vite & Tailwind CSS Template on [Coherence](withcoherence.com).

## How to use

1. Sign up for an account at [app.withcoherence.com](https://app.withcoherence.com/)
2. Once you have created an account, create a new application.
3. On the "App details" page, inside step #2 "Import a repo," click on the "Import feature" link to import a repo into your GitHub account.
4. Copy and paste this repo's URL `https://github.com/coherenceplatform/django-react-tailwind-template` into the "Your old repository’s clone URL" field.
5. Give your new repo a name and then click the "Begin import" button.
6. After the repo has imported, copy and paste the new repo's URL into the "Repo URL" field in Coherence.
7. Follow the remaining onboarding instructions.

Coherence will set up your Cloud IDE, automatic preview environments, CI/CD pipelines, and managed cloud infrastructure.
