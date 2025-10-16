# Riyada OpenBanking MVP

The Riyada OpenBanking MVP is a Saudi Open Banking platform scaffold aligned with the Saudi Central Bank (SAMA) Account Information Service (AIS) and Payment Initiation Service (PIS) frameworks. It provides a mocked **Client Initiated Backchannel Authentication (CIBA)** journey, consent APIs, national connector stubs, and compliance hooks mapped to **FAPI Advanced + CIBA** and the Saudi Personal Data Protection Law (PDPL).

## Platform Highlights

- **Mocked CIBA backchannel flow** with Nafath-style approval simulation and token polling.
- **Consent-as-a-Service APIs** with PDPL hooks for receipts, audit logging, and minimisation checks.
- **Connector stubs** for Nafath, Absher, and SIMAH ready to be swapped for real integrations.
- **Security middlewares** for JWT validation, nonce enforcement, rate limiting, mTLS/JWS placeholders, and Helmet hardening.
- **Postgres + Prisma models** for consents/audit trails and Redis-backed CIBA state management.
- **Developer experience** featuring OpenAPI docs, Swagger UI, and a static demo UI walking through the journey.
- **Containerised stack** (Node.js API, Postgres, Redis) for rapid local spin-up.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Docker + Docker Compose (for the containerised stack)

### Local Development

1. Copy `.env.example` to `.env` and adjust secrets if required.
2. Install dependencies and generate the Prisma client.
3. Run the API in watch mode.

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

The API listens on `http://localhost:3000`. Swagger UI serves the OpenAPI contract at `/docs`, while the static walkthrough is available at `/demo`.

### Database & Prisma

- Database URL defaults to `postgresql://postgres:postgres@localhost:5432/openbanking`.
- Run `npm run db:migrate` to create/update the schema and `npm run db:seed` to load starter consents.
- Prisma models cover `Consent` and `AuditLog` tables with enum-backed statuses.

## Project Structure

```
├── src
│   ├── auth/           # CIBA services + mock Nafath routes
│   ├── consents/       # Consent router
│   ├── connectors/     # Nafath, Absher, SIMAH stubs
│   ├── config/         # Env, logger, Prisma, Redis helpers
│   ├── middleware/     # JWT, nonce, rate limiting, security placeholders
│   ├── services/       # Consent service orchestrating PDPL hooks
│   └── utils/          # PDPL helper stubs
├── docs/               # OpenAPI spec + static demo UI
├── prisma/             # Prisma schema and seed script
├── tests/              # Jest + Supertest skeletons for auth & consent flows
├── Dockerfile          # Multi-stage image (dev + prod)
└── docker-compose.yml  # API + Postgres + Redis stack
```

## Security & Compliance Placeholders

- **JWT validation** middleware models FAPI Advanced bearer token enforcement.
- **Nonce enforcement** protects against replay per FAPI Advanced requirements.
- **Helmet + rate limiting** baseline hardening.
- **mTLS and JWS placeholders** indicate where financial-grade controls will plug in.
- **PDPL functions** (`issueConsentReceipt`, `assertDataMinimisation`, `appendAuditTrail`) surface integration points for regulatory artefacts and immutable logging.

## Developer Tooling

- **ESLint + Prettier** enforce consistent TypeScript style (`npm run lint`, `npm run format`).
- **Jest** skeletons demonstrate auth and consent scenarios using Supertest (`npm run test`).
- **Swagger UI** is automatically served for the OpenAPI contract.
- **Static demo UI** demonstrates the mocked login → approval → token polling journey.

## Docker Compose Stack

Running `docker-compose up --build` starts:

- `api`: Node.js service (ts-node-dev) with hot reload.
- `postgres`: Postgres 15 with persisted volume (`pgdata`).
- `redis`: Redis 7 for nonce & CIBA session state (`redisdata`).

After the containers are healthy, run migrations and seeds inside the API container if required:

```bash
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed
```

## Next Steps

- Replace connector stubs with live Nafath, Absher, and SIMAH integrations.
- Implement mTLS certificate validation and full JOSE (JWS/JWE) request/response signing.
- Extend PDPL hooks with production-grade consent receipt storage and immutable audit log sinks.
- Build out AIS/PIS domain APIs, fintech partner onboarding flows, and observability pipelines.

## License

Apache 2.0
