# Riyada Open Finance Architecture

## ASCII Context Diagram (C4 Level 1)
```
+-----------------------------------------------------------+
|                      External Actors                      |
|                                                           |
|  [Consumer Apps]  [TPP Platforms]  [Internal Ops Portal]  |
|           \             |                /                |
+------------\------------|---------------/-----------------+
             \            |              /
              v           v             v
        +---------------------------------------+
        |        Riyada Open Finance Platform   |
        | (API Gateway + Services + Datastores) |
        +---------------------------------------+
              ^           ^             ^
             /            |              \
            /             |               \
+----------/--------------|----------------\------------+
|   External Services     |      Regulators |  Identity  |
| [Nafath] [Absher] [SIMAH] [SAMA/SDAIA SIEM] [Bank APIs] |
+---------------------------------------------------------+
```

## Mermaid Context Diagram
```mermaid
C4Context
  title Riyada Open Finance Context
  Person(consumer, "End User", "Individuals authorizing data access")
  Person(tpp, "Third-Party Provider", "Fintech consuming APIs")
  Person(ops, "Operations Team", "Manages incidents, compliance")
  System_Boundary(riyada, "Riyada Platform") {
    Container(apigw, "API Gateway", "Kong", "AuthZ, rate limiting, schema validation")
    Container(services, "Microservices", "Node.js", "KYC, Risk, Credit, Consent")
    ContainerDb(pg, "Postgres", "Data", "Encrypted consent & user data")
    ContainerDb(redis, "Redis", "Cache", "Session/cache tokens")
    Container_Ext(otel, "Observability", "OTel Collector", "Metrics, traces, logs")
  }
  System_Ext(nafath, "Nafath", "National identity auth")
  System_Ext(absher, "Absher", "Step-up verification")
  System_Ext(simah, "SIMAH", "Credit bureau")
  System_Ext(sama, "SAMA CSF Portal", "Regulator audit access")

  Rel(consumer, apigw, "OAuth2 + PKCE")
  Rel(tpp, apigw, "Client credentials / PAR")
  Rel(ops, services, "Secure Ops Portal")
  Rel(apigw, services, "mTLS + JWT")
  Rel(services, pg, "Encrypted SQL")
  Rel(services, redis, "Cache data")
  Rel(services, nafath, "CIBA callbacks")
  Rel(services, absher, "Step-up API")
  Rel(services, simah, "Credit checks")
  Rel(services, otel, "OTel traces")
  Rel(services, sama, "Evidence feeds")
```

## Container Diagram (C4 Level 2)
```mermaid
C4Container
  title Container View
  Person(tpp, "TPP App")
  System_Boundary(riyada, "Riyada Platform") {
    Container(apigw, "API Gateway", "Kong", "Edge auth, rate limiting, schema validation")
    Container(spa, "Developer Portal", "React", "Consent + analytics UI")
    Container(service_api, "Service API", "Fastify", "REST & Webhooks")
    Container(consent_svc, "Consent Service", "Fastify", "Manage consents & receipts")
    Container(risk_svc, "Risk Service", "Fastify", "Risk scoring & policies")
    Container(credit_svc, "Credit Service", "Fastify", "SIMAH queries")
    ContainerDb(pg, "Postgres", "Data", "PII encrypted at rest")
    ContainerDb(redis, "Redis", "Cache", "Tokens & rate limits")
    Container(kafka, "Kafka", "Event streaming", "Audit/events")
    Container(otel, "OTel Collector", "Telemetry", "Traces/logs")
  }
  Rel(tpp, apigw, "HTTPS + OAuth2")
  Rel(apigw, service_api, "mTLS + JWT")
  Rel(service_api, consent_svc, "gRPC/mTLS")
  Rel(service_api, risk_svc, "HTTP/mTLS")
  Rel(service_api, credit_svc, "HTTP/mTLS")
  Rel(service_api, kafka, "Event publish")
  Rel(consent_svc, pg, "Read/Write")
  Rel(risk_svc, pg, "Read")
  Rel(credit_svc, pg, "Read/Write")
  Rel(consent_svc, kafka, "Audit events")
  Rel(service_api, redis, "Caching")
  Rel(service_api, otel, "Traces")
```

## Component Diagram (C4 Level 3 – Service API)
```mermaid
C4Component
  title Service API Component View
  Container_Boundary(service_api, "Service API") {
    Component(router, "HTTP Router", "Fastify", "Routes requests")
    Component(authmw, "Auth Middleware", "OIDC + DPoP", "Validates tokens, scopes, nonce")
    Component(fga, "FGA Adapter", "OPA/Rego", "Evaluates ABAC policies")
    Component(controller, "Controllers", "TypeScript", "KYC, Risk, Credit handlers")
    Component(service_layer, "Domain Services", "TypeScript", "Business logic + retries")
    Component(repo, "Repository Layer", "Prisma", "Database access")
    Component(cache, "Cache Adapter", "Redis", "Idempotency + sessions")
    Component(client_nf, "Nafath Client", "HTTP", "CIBA flows")
    Component(client_simah, "SIMAH Client", "SOAP/REST", "Credit checks")
    Component(client_absher, "Absher Client", "REST", "Step-up auth")
    Component(eventpub, "Event Publisher", "Kafka", "Audit & telemetry events")
  }
  Rel(router, authmw, "Requests")
  Rel(authmw, fga, "Policy checks")
  Rel(controller, service_layer, "Invoke use cases")
  Rel(service_layer, repo, "CRUD via Prisma")
  Rel(service_layer, cache, "Get/set idempotency")
  Rel(service_layer, client_nf, "CIBA request")
  Rel(service_layer, client_simah, "SIMAH query")
  Rel(service_layer, client_absher, "Step-up trigger")
  Rel(service_layer, eventpub, "Audit events")
```

## Sequence Diagram – Auto Approval Decision
```mermaid
sequenceDiagram
  participant Client as TPP Client
  participant API as API Gateway
  participant Service as Service API
  participant Risk as Risk Service
  participant Credit as Credit Service
  participant Consent as Consent Service

  Client->>API: POST /v1/approval/decide (DPoP, JWT)
  API->>Service: Forward (mTLS, JWT)
  Service->>Risk: POST /score (idempotency key)
  Risk-->>Service: RiskScore (traceparent)
  Service->>Credit: POST /check (SIMAH payload)
  Credit-->>Service: CreditReport (signed)
  Service->>Consent: GET /consents/{id}
  Consent-->>Service: ConsentDetails (JWS receipt)
  Service->>Service: Evaluate policy (ABAC + thresholds)
  Service-->>API: 200 Decision=Approved/ManualReview with Problem+JSON on failure
  API-->>Client: Response + headers (RateLimit, Traceparent)
```
