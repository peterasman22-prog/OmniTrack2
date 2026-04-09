# Step 3: Production Polish — Implementation Roadmap

> **OmniTrack Platform**  
> **Status:** Planning · **Target:** Post-MVP  
> **Last Updated:** April 2026

---

## Overview

This document outlines the implementation plan for hardening OmniTrack from a functional MVP into a production-grade platform. Items are organized by category, prioritized, and estimated.

### Priority Legend

| Priority | Meaning |
|----------|---------|
| 🔴 P0 | **Critical** — Must have before any production traffic |
| 🟠 P1 | **High** — Should ship within first production sprint |
| 🟡 P2 | **Medium** — Important for scale and maintainability |
| 🟢 P3 | **Nice to have** — Improves DX and long-term quality |

### Effort Legend

| Size | Estimate |
|------|----------|
| S | 1–2 days |
| M | 3–5 days |
| L | 1–2 weeks |
| XL | 2–4 weeks |

---

## 1. Authentication & Authorization

**Current state:** Auth is disabled (`AUTH_ENABLED=false`). Placeholder middleware exists. MVP auto-login with hardcoded credentials.

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 1.1 | **Implement JWT authentication** | 🔴 P0 | M | Generate JWT on login, validate on every request. Use `jsonwebtoken` library. Store refresh tokens in httpOnly cookies. Access token expiry: 15 min, refresh: 7 days. |
| 1.2 | **Build login/register API** | 🔴 P0 | M | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. Hash passwords with `bcrypt` (min 12 rounds). Add `User` model to Prisma schema. |
| 1.3 | **Implement RBAC middleware** | 🔴 P0 | S | Create `requireRole('admin', 'operator')` middleware. Define three roles: Admin, Operator, Viewer. Enforce on all route groups. |
| 1.4 | **Frontend auth flow** | 🔴 P0 | M | Replace auto-login with real login page. Store tokens in memory (not localStorage). Implement silent refresh. Add protected route wrapper. Redirect to login on 401. |
| 1.5 | **Password reset flow** | 🟠 P1 | M | Email-based reset token. Token expiry: 1 hour. Rate limit: 3 requests/hour per email. |
| 1.6 | **Multi-tenant isolation** | 🟡 P2 | L | Enforce `tenantId` filtering on all queries. Add tenant-scoped middleware. Ensure no cross-tenant data leakage. |

---

## 2. Security Hardening

**Current state:** Helmet enabled, basic CORS and rate limiting configured. No input sanitization beyond Joi validation.

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 2.1 | **Input sanitization** | 🔴 P0 | S | Add `express-mongo-sanitize` equivalent for SQL. Sanitize all string inputs. Strip HTML tags from user-provided text. |
| 2.2 | **SQL injection prevention** | 🔴 P0 | S | Audit all Prisma queries — Prisma parameterizes by default, but verify no raw SQL usage. Add `prisma.$queryRaw` safeguards if needed. |
| 2.3 | **XSS protection** | 🔴 P0 | S | Add `Content-Security-Policy` headers via Helmet. Sanitize any user-generated content rendered in frontend. Use React's built-in escaping (already active). |
| 2.4 | **CORS tightening** | 🔴 P0 | S | Replace `CORS_ORIGIN=*` with explicit frontend URL. Add allowed methods and headers whitelist. |
| 2.5 | **Rate limiting improvements** | 🟠 P1 | S | Per-endpoint rate limits (stricter on auth routes: 5 req/min). Add sliding window algorithm. Return `Retry-After` header. |
| 2.6 | **HTTPS enforcement** | 🔴 P0 | S | Railway handles TLS termination. Add `Strict-Transport-Security` header. Redirect HTTP → HTTPS. |
| 2.7 | **Dependency audit** | 🟠 P1 | S | Run `npm audit` and fix vulnerabilities. Add `npm audit` to CI pipeline. Pin dependency versions. |
| 2.8 | **API key management** | 🟡 P2 | M | Implement API key generation for service-to-service auth. Key rotation support. Scoped permissions per key. |
| 2.9 | **WebSocket authentication** | 🔴 P0 | S | Require JWT token on WebSocket handshake. Validate token before allowing subscription. Disconnect on token expiry. |

---

## 3. Error Handling & Resilience

**Current state:** `AppError` class exists. Global error handler catches unhandled errors. Basic logging with Winston.

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 3.1 | **Structured error responses** | 🟠 P1 | S | Standardize error shape: `{ error: { code, message, details, requestId } }`. Map Prisma errors to user-friendly messages. |
| 3.2 | **Request ID tracking** | 🟠 P1 | S | Generate UUID per request. Include in all logs and error responses. Add `X-Request-Id` header. |
| 3.3 | **Circuit breaker for NATS** | 🟡 P2 | M | Implement circuit breaker pattern for NATS connection. Auto-reconnect with exponential backoff (already partially implemented). Add health status tracking. |
| 3.4 | **Database connection resilience** | 🟠 P1 | S | Configure Prisma connection pool (`connection_limit`, `pool_timeout`). Add retry logic for transient failures. |
| 3.5 | **Frontend error boundaries** | 🟠 P1 | S | Add React Error Boundaries around major page sections. Show user-friendly fallback UI. Report errors to backend. |
| 3.6 | **Graceful degradation** | 🟡 P2 | M | Dashboard works in read-only mode if WebSocket disconnects. Show stale data indicators. Queue failed API calls for retry. |

---

## 4. Performance Optimization

**Current state:** No caching. Basic database indexes from Prisma schema. All queries hit database directly.

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 4.1 | **Add Redis caching layer** | 🟠 P1 | M | Cache frequently accessed data: venue list, floor plans, asset counts. TTL: 30-60 seconds. Invalidate on writes. |
| 4.2 | **Database indexing** | 🔴 P0 | S | Add composite indexes: `TelemetryEvent(deviceId, timestamp)`, `Alert(status, severity)`, `DeviceTwin(venueId, lastSeen)`. Analyze slow queries with `EXPLAIN`. |
| 4.3 | **Query optimization** | 🟠 P1 | M | Add pagination to all list endpoints (already partial). Limit `include` depth in Prisma. Use `select` to fetch only needed fields. |
| 4.4 | **Telemetry data archival** | 🟡 P2 | L | Partition `TelemetryEvent` table by month. Archive data older than 90 days to cold storage. Add retention policy configuration. |
| 4.5 | **Frontend bundle optimization** | 🟠 P1 | S | Enable code splitting by route. Lazy-load Reports/Charts. Analyze bundle with `vite-plugin-visualizer`. Target: < 300KB initial JS. |
| 4.6 | **CDN for static assets** | 🟡 P2 | S | Configure CDN (Cloudflare/CloudFront) for frontend static files. Set cache headers: immutable for hashed assets, short TTL for index.html. |
| 4.7 | **WebSocket optimization** | 🟡 P2 | M | Implement message batching (aggregate position updates over 500ms). Add binary protocol option for high-frequency data. Compress payloads. |
| 4.8 | **Database connection pooling** | 🟠 P1 | S | Configure PgBouncer or Prisma Data Proxy for connection pooling. Target: 20 connections per service instance. |

---

## 5. Testing

**Current state:** No automated tests.

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 5.1 | **Unit test setup** | 🔴 P0 | S | Configure Jest for API Gateway and Normalization Service. Add `ts-jest` for TypeScript. Target: all utility functions and normalizers. |
| 5.2 | **API integration tests** | 🔴 P0 | L | Use Supertest for endpoint testing. Set up test database with Docker. Test all CRUD operations, validation, and error cases. Target: 80%+ coverage on controllers. |
| 5.3 | **Frontend unit tests** | 🟠 P1 | M | Configure Vitest + React Testing Library. Test Zustand stores, utility functions, and key components (FloorPlanView, AssetList, AlertTicker). |
| 5.4 | **E2E tests** | 🟡 P2 | L | Set up Playwright or Cypress. Test critical flows: login → dashboard → select asset → view detail → acknowledge alert. Run in CI with Docker Compose. |
| 5.5 | **Load testing** | 🟡 P2 | M | Use k6 or Artillery. Simulate: 100 concurrent WebSocket connections, 1000 req/min API load, 500 telemetry events/sec ingestion. Identify bottlenecks. |
| 5.6 | **CI pipeline** | 🔴 P0 | M | GitHub Actions workflow: lint → type-check → unit tests → integration tests → build → deploy. Run on every PR. Block merge on failure. |

---

## 6. Monitoring & Observability

**Current state:** Winston logging to console. No metrics. No alerting pipeline.

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 6.1 | **Structured logging** | 🟠 P1 | S | Ensure all logs are JSON with fields: `timestamp`, `level`, `service`, `requestId`, `message`, `meta`. Ship to log aggregator (Railway logs or external). |
| 6.2 | **Health check endpoints** | 🔴 P0 | S | Expand `/health` to include: database connectivity, NATS connectivity, memory usage, uptime. Add `/health/ready` and `/health/live` for Kubernetes compatibility. |
| 6.3 | **Application metrics** | 🟠 P1 | M | Export Prometheus metrics: request count/latency (p50/p95/p99), WebSocket connections, telemetry throughput, error rate. Use `prom-client`. |
| 6.4 | **Dashboard (Grafana)** | 🟡 P2 | M | Create Grafana dashboards for: API latency, error rates, WebSocket connections, telemetry throughput, database query times. |
| 6.5 | **Alerting rules** | 🟠 P1 | S | Set up alerts: error rate > 1%, p99 latency > 2s, WebSocket connections drop > 50%, disk usage > 80%. Notify via Slack/email. |
| 6.6 | **Distributed tracing** | 🟡 P2 | M | Add OpenTelemetry instrumentation. Trace requests across API Gateway → NATS → Normalization Service. Visualize with Jaeger or Tempo. |
| 6.7 | **Frontend error tracking** | 🟠 P1 | S | Integrate Sentry or similar. Capture unhandled errors, rejected promises, and component crashes. Include user context and breadcrumbs. |

---

## 7. Documentation Improvements

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 7.1 | **OpenAPI / Swagger spec** | 🟠 P1 | M | Generate OpenAPI 3.0 spec from routes. Serve Swagger UI at `/api/docs`. Document all endpoints, request/response schemas, and error codes. |
| 7.2 | **Architecture decision records** | 🟡 P2 | S | Document key decisions: tech stack choices, database schema design, real-time architecture, deployment strategy. |
| 7.3 | **Deployment guide** | 🟠 P1 | S | Document Railway deployment process. Include environment variable reference, database migration steps, and rollback procedures. |
| 7.4 | **API changelog** | 🟡 P2 | S | Maintain a changelog for API changes. Version the API (`/api/v1/`). Document breaking changes and migration paths. |
| 7.5 | **Contributing guide** | 🟢 P3 | S | `CONTRIBUTING.md` with: local setup, coding standards, PR process, commit message conventions, branch naming. |

---

## 8. Implementation Timeline

### Phase 1: Security Foundation (Weeks 1–2) — 🔴 P0 Items

| Week | Focus | Tasks |
|------|-------|-------|
| 1 | Auth & Security | 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.6, 2.9 |
| 2 | Testing & Infra | 4.2, 5.1, 5.2, 5.6, 6.2 |

**Milestone:** Secure, tested API with real authentication.

### Phase 2: Reliability & Quality (Weeks 3–4) — 🟠 P1 Items

| Week | Focus | Tasks |
|------|-------|-------|
| 3 | Performance & Errors | 1.5, 2.5, 2.7, 3.1, 3.2, 3.4, 3.5, 4.1, 4.3 |
| 4 | Monitoring & Docs | 4.5, 4.8, 5.3, 6.1, 6.3, 6.5, 6.7, 7.1, 7.3 |

**Milestone:** Observable, resilient platform with monitoring.

### Phase 3: Scale & Polish (Weeks 5–8) — 🟡 P2 + 🟢 P3 Items

| Week | Focus | Tasks |
|------|-------|-------|
| 5–6 | Scale | 1.6, 3.3, 3.6, 4.4, 4.6, 4.7, 5.4, 5.5 |
| 7–8 | Polish | 6.4, 6.6, 7.2, 7.4, 7.5 |

**Milestone:** Production-hardened, scalable platform.

---

## 9. Summary

| Category | P0 Tasks | P1 Tasks | P2 Tasks | P3 Tasks | Total |
|----------|----------|----------|----------|----------|-------|
| Auth & Authorization | 4 | 1 | 1 | 0 | **6** |
| Security | 5 | 2 | 1 | 0 | **8** |
| Error Handling | 0 | 3 | 2 | 0 | **5** *(1 added: 3.6 counted as P2)* |
| Performance | 1 | 4 | 3 | 0 | **8** |
| Testing | 2 | 1 | 2 | 0 | **5** *(+CI as P0)* |
| Monitoring | 1 | 3 | 2 | 0 | **6** *(+frontend tracking as P1)* |
| Documentation | 0 | 2 | 2 | 1 | **5** |
| **Total** | **13** | **16** | **13** | **1** | **43** |

**Estimated total effort:** 8–10 weeks for a team of 2 developers.

---

*This roadmap is a living document. Reprioritize based on user feedback, incident reports, and business requirements.*
