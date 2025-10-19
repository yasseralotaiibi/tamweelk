# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a multi-service financial platform consisting of:

1. **Riyada OpenBanking MVP** (Node.js/TypeScript) - Main OpenBanking platform aligned with SAMA standards
2. **FinTech API** (Python/FastAPI) - Financial calculation engine with 100+ financial endpoints

## Development Commands

### Node.js OpenBanking Service

```bash
# Development
npm run dev                 # Start development server with hot reload
npm run build              # Build TypeScript to JavaScript
npm run start              # Start production server

# Code Quality
npm run lint               # ESLint with max-warnings=0
npm run format             # Prettier formatting

# Testing & Database
npm run test               # Jest test suite
npm run db:migrate         # Run Prisma migrations
npm run db:seed            # Seed database with test data

# Docker
docker-compose up --build  # Start full stack (API + Postgres + Redis)
docker-compose exec api npm run db:migrate  # Run migrations in container
```

### Python FinTech API

```bash
# Development (FastAPI)
uvicorn main:app --reload   # Start development server
python main.py              # Alternative start method

# Dependencies
pip install -r requirements.txt  # Install Python dependencies
```

## Architecture Overview

### OpenBanking Service (Node.js/TypeScript)

**Core Architecture Pattern**: Layered architecture with clean separation of concerns

- **Entry Point**: `src/server.ts` → `src/app.ts`
- **Routing Layer**: Express routers in dedicated modules
  - `/ciba/auth` - CIBA authentication flow
  - `/consents` - Consent management APIs  
  - `/mock` - Mock Nafath services for testing
  - `/docs` - Swagger UI documentation
  - `/demo` - Static demo interface

**Directory Structure**:
- `src/auth/` - CIBA services + mock Nafath implementation
- `src/consents/` - Consent router and business logic
- `src/connectors/` - External service stubs (Nafath, Absher, SIMAH)
- `src/config/` - Environment, logging, Prisma, Redis configuration
- `src/middleware/` - JWT validation, nonce enforcement, rate limiting
- `src/services/` - Business logic orchestrating PDPL compliance
- `src/utils/` - PDPL helper functions and utilities

**Data Layer**:
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Session**: Redis for CIBA state and nonce management
- **Models**: `Consent` and `AuditLog` with enum-based status tracking

**Security & Compliance**:
- FAPI Advanced + CIBA flow implementation
- Saudi Personal Data Protection Law (PDPL) hooks
- JWT validation, nonce enforcement, rate limiting
- mTLS and JWS placeholders for production deployment

### FinTech API (Python/FastAPI)

**Architecture**: Task-based calculation engine with 100+ financial endpoints

- **Entry Point**: `main.py` with FastAPI application
- **Task Organization**: Individual calculation modules in `tasks/` directory
- **Validation**: Pydantic models in `validators/request_validators`
- **Endpoints**: RESTful API with comprehensive financial calculations

**Key Calculation Categories**:
- Interest & Investment: Simple/compound interest, SIP, ROI, pension calculations
- Risk & Portfolio: CAPM, Sharpe ratio, portfolio variance, asset turnover
- Corporate Finance: WACC, cash flow, debt ratios, coverage ratios  
- Consumer Finance: Loan EMI, mortgage, credit card, personal savings

## Development Patterns

### OpenBanking Service Conventions

**Error Handling**: Centralized error middleware in `src/middleware/errorHandler.ts`

**Logging**: Winston logger configured in `src/config/logger.ts`

**Environment**: Configuration managed through `src/config/env.ts` with `.env` file

**Database Patterns**:
```typescript
// Prisma client usage
await prisma.consent.create({
  data: { customerId, provider, scopes, expiresAt }
});

// Audit logging pattern
await prisma.auditLog.create({
  data: { consentId, event, metadata }
});
```

**CIBA Flow Implementation**:
- Authentication initiation → backchannel polling → token exchange
- Mock Nafath integration for development/testing
- Redis-based session state management

### FinTech API Patterns

**Task Structure**: Each calculation is a separate module returning consistent response format

**Request Validation**: All endpoints use Pydantic models for input validation

**Response Format**: Standardized JSON responses with calculation results and metadata

## Testing Strategy

### Node.js Service
- **Framework**: Jest with Supertest for API testing
- **Test Location**: `tests/` directory
- **Coverage**: Configured to collect coverage from `src/**/*.ts`
- **Database**: Test database isolation through Prisma

### Python Service
- **Framework**: FastAPI's built-in testing (Starlette TestClient)
- **Validation**: Focus on endpoint input/output validation
- **Calculations**: Unit tests for financial calculation accuracy

## Docker & Deployment

**Multi-Container Setup**:
- `api`: Node.js service with hot reload in development
- `postgres`: PostgreSQL 16 with persistent volumes
- `redis`: Redis 7 for session management

**Security Hardening**: 
- Read-only containers, non-root users, dropped capabilities
- Health checks for all services
- Comprehensive logging with rotation

**Environment Variables Required**:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/openbanking
REDIS_URL=redis://default:password@redis:6379
JWT_SECRET=your-secret-key
POSTGRES_PASSWORD=strong-password
REDIS_PASSWORD=strong-password
```

## Key Integration Points

**External Services** (Stubs in development):
- **Nafath**: Saudi digital identity verification
- **Absher**: Government services platform  
- **SIMAH**: Credit bureau integration

**Compliance Hooks**:
- Consent receipts generation
- Data minimization assertions
- Immutable audit trail logging
- PDPL regulatory artifact management

## API Documentation

- **OpenBanking API**: Available at `/docs` (Swagger UI)
- **FinTech API**: FastAPI auto-generated docs at `/docs` when running
- **OpenAPI Spec**: Located in `docs/openapi.yaml`
- **Demo Interface**: Static demo at `/demo` for CIBA flow walkthrough