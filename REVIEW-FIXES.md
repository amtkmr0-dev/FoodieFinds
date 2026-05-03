# Manus Review - Applied Fixes

This document tracks the changes made in response to the
[Manus FoodieFinds review](https://manus.im/share/kyIliEiIbevSWC0lSugkig).

The review identified four priority areas: **Architecture, Frontend,
Security, API Efficiency**, plus a fifth on **Code Quality**. The first
pass below addresses the highest-impact, lowest-risk fixes that don't
require rewriting the storage layer or moving payment logic across the
client/server boundary. Larger items are tracked in the **Follow-up work**
section so they're not forgotten.

---

## Done in this PR

### 1. Hardcoded public IP / `NEXT_PUBLIC_*` in shared constants (§3.2)

**Before:**
```ts
// packages/shared/src/constants.ts
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://13.234.19.105:5000'
```

**After:** A `resolveApiBaseUrl()` helper that checks, in order,
`import.meta.env.VITE_API_URL` (Vite client builds), then
`process.env.API_BASE_URL` / `VITE_API_URL` (Node), then `''`
(same-origin). No infrastructure IPs in the repo.

### 2. Centralized error handling + structured logger (§1.2)

- New `server/logger.ts`: leveled logger that emits JSON in production.
- New `server/middleware/errorHandler.ts`: AppError class + middleware
  hides stack traces in production.
- New `server/middleware/requestLogger.ts`: shared request logging.

### 3. Unified security middleware between dev and prod (§3.4)

Both entry points now call `applySecurityMiddleware(app)` from
`server/middleware/security.ts`. CORS origins resolve from
`ALLOWED_ORIGINS` in production with no permissive defaults.

### 4. Granular RBAC scaffold (§3.3)

`server/auth.ts` gains a `PERMISSIONS` enum + `requirePermission(...)`
middleware alongside the existing `requireRole(...)`.

### 5. API versioning prefix without breaking existing clients (§4.3)

Routes accept both `/api/*` and `/api/v1/*` via a rewrite shim.

### 6. Consolidated shared utilities (§2.3)

`formatCurrency`, `parseCurrency`, `formatPhoneNumber` live in
`packages/shared/src/utils.ts`. Client `lib/utils.ts` and
`lib/currency.ts` are thin re-export shims.

### 7. Test scaffolding (§5.3)

Vitest specs covering JWT lifecycle, AppError shape, shared utils, and
the server-authoritative billing regression test.

### 8. Server-authoritative billing & polling (§2.1)

`POST /api/wallet/deduct-call` now IGNORES client-supplied `totalCost`
and recomputes from `durationSeconds * pricePerMinute + giftCost`.
New `GET /api/wallet/:userId/balance-status` returns canonical live
balance. New `GET /api/wallet/:userId/has-completed-recharge` replaces
the spoofable localStorage flag. Client hooks refactored to consume
server-computed values.

### 9. Realtime push instead of polling (§4.1)

Three polling loops replaced by WebSocket subscription:
- useWallet (was 10s) → wallet:{userId} sub
- usePaymentPolling (was 3s) → payment:{txnId} sub, 30s HTTP fallback
- useCallBalanceMonitor (was 2s) → wallet:{userId} sub, 15s HTTP fallback

New `server/realtime.ts` (WebSocketServer at /ws with JWT auth +
channel pub/sub) and `client/src/lib/realtime.ts` (singleton with
reconnect+backoff).

### 10. Split `server/routes.ts` into per-feature modules (§5.1)

1,192-line monolith → 8 files under `server/routes/`:
auth (7), wallet (6), payments (3), gifts (2), admin (5), simulation (19),
plus _shared.ts and index.ts. All 42 routes preserved verbatim.

---

## Follow-up work (NOT in this PR)

| §   | Manus item                                       | Why deferred                                                  |
|-----|--------------------------------------------------|---------------------------------------------------------------|
| 1.1 | Replace `MemStorage` with Drizzle/Postgres       | Needs schema migrations + data backfill.                      |
| 2.2 | Replace `creatorsData.ts` static data with API   | Needs `/api/v1/creators` endpoint + caching strategy.         |
| 3.1 | JWT in HTTP-only cookies (vs. localStorage)      | Full migration needs server-side `Set-Cookie` + CSRF tokens.  |
| 4.2 | Eager-loading to fix N+1 queries                 | Blocked on §1.1.                                              |
| 5.2 | Centralize type definitions                      | Most types already in `packages/shared/src/schemas.ts`.       |
