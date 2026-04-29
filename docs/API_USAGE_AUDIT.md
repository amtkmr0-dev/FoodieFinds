# LINKY API Usage Audit

Last updated: 2026-04-29

This audit compares backend routes in `server/routes.ts` against frontend usage in `client/src`. It also records smoke-test results and issues found.

## Summary

Total backend routes found: 51

Status buckets:

- Actively used by current UI: core app APIs used by user, creator, admin, calls, wallet, gifts, and Razorpay flows.
- Partially wired: backend exists but UI is static/incomplete or only some actions use it.
- Legacy/unused: old APIs kept for compatibility, not used by the current UI flow.
- Dev/test only: simulation APIs.
- Fixed during audit: APIs the UI called but backend did not implement.

## Fixed During This Audit

### `POST /api/admin/update-rate`

Problem:

- `AdminDashboard.tsx` called `/api/admin/update-rate`.
- Backend route did not exist, causing admin pricing updates to fall back to localStorage/offline mode.

Fix:

- Added backend route.
- Validates creator rate between `10` and `500`.
- Stores rate in memory.
- Updates pending creator application `currentRate` when the id matches.

Smoke test:

```json
{
  "success": true,
  "creatorId": "creator_9717629693",
  "rate": 75
}
```

### `POST /api/admin/update-commission`

Problem:

- `AdminDashboard.tsx` called `/api/admin/update-commission`.
- Backend route did not exist, causing agency commission updates to fall back to localStorage/offline mode.

Fix:

- Added backend route.
- Validates commission between `1` and `80`.
- Stores commission in memory.
- Updates pending agent application `currentCommission` when the id matches.

Smoke test:

```json
{
  "success": true,
  "agencyId": "agent_9717629694",
  "commission": 35
}
```

### Wallet transaction payment method type

Problem:

- Frontend and Razorpay flow use `netbanking`.
- Storage type allowed `net_banking`, but not `netbanking`.

Fix:

- Storage type now accepts both `netbanking` and `net_banking`.

## Actively Used APIs

These routes are called by current frontend code and are part of normal app flow.

| API | Frontend caller | Purpose | Smoke status |
|---|---|---|---|
| `POST /api/auth/send-otp` | `client/src/lib/auth.ts` | User signup/login OTP request | In use |
| `POST /api/auth/verify-otp` | `client/src/lib/auth.ts` | Verify OTP and create user session | In use |
| `POST /api/auth/admin/login` | `client/src/lib/auth.ts` | Admin/super/support login | In use |
| `POST /api/auth/refresh` | `client/src/lib/auth.ts` | Refresh access token | In use |
| `POST /api/auth/logout` | `client/src/lib/auth.ts` | User logout | In use |
| `POST /api/auth/admin/logout` | `client/src/lib/auth.ts` | Admin logout | In use |
| `GET /api/auth/verify` | `client/src/lib/auth.ts` | Verify JWT session | In use |
| `GET /api/wallet/:userId` | `client/src/hooks/useWallet.tsx` | Fetch wallet balance | 200 |
| `GET /api/wallet/:userId/transactions` | `client/src/pages/AccountPage.tsx` | Talktime/wallet transaction history | 200 |
| `POST /api/razorpay/orders` | `client/src/lib/razorpay.ts` | Create Razorpay order | 200 |
| `POST /api/razorpay/verify` | `client/src/lib/razorpay.ts` | Verify payment and credit wallet | Not smoke-tested without real checkout signature |
| `POST /api/zego/token` | `client/src/lib/zego.ts` | Create ZEGOCLOUD token for calls | Config-dependent |
| `POST /api/wallet/deduct-call` | `client/src/components/CallInterface.tsx` | Deduct call cost, credit creator, log call | 200 for valid wallet; 400 on insufficient funds |
| `GET /api/call-logs/user/:userId` | `client/src/pages/AccountPage.tsx` | User call history | 200 |
| `GET /api/call-logs/creator/:creatorId` | `client/src/pages/CreatorApp.tsx` | Creator call history | 200 |
| `GET /api/creator/:creatorId/earnings` | `client/src/pages/CreatorApp.tsx` | Creator earnings/wallet total | 200 |
| `GET /api/creator/:creatorId/status` | `client/src/pages/CreatorApp.tsx` | Creator status: available/on_call/offline | 200 |
| `POST /api/creator/:creatorId/status` | `client/src/lib/creator-status.ts` | Update creator status on accept/reject/end | 200 |
| `GET /api/gifts` | `client/src/components/GiftSelectionModal.tsx` | Fetch active gift catalog | 200 |
| `POST /api/gifts/send` | `client/src/components/GiftSelectionModal.tsx` | Debit user wallet and credit creator for gift | 200 |
| `POST /api/creator/applications` | `client/src/pages/CreatorOnboarding.tsx` | Creator/agent KYC application | 201 |
| `GET /api/admin/kyc-applications` | `client/src/pages/AdminDashboard.tsx` | Admin KYC queue | 200 |
| `POST /api/admin/approve` | `client/src/pages/AdminDashboard.tsx` | Approve KYC application | In use |
| `POST /api/admin/reject` | `client/src/pages/AdminDashboard.tsx` | Reject KYC application | In use |
| `POST /api/admin/ban` | `client/src/pages/AdminDashboard.tsx` | Ban application/account | In use |
| `POST /api/admin/update-rate` | `client/src/pages/AdminDashboard.tsx` | Update creator rate | Fixed, 200 |
| `POST /api/admin/update-commission` | `client/src/pages/AdminDashboard.tsx` | Update agency commission | Fixed, 200 |

## Partially Wired APIs

These APIs exist and are useful, but current UI does not fully use them yet.

| API | Current state | Recommendation |
|---|---|---|
| `GET /api/admin/gifts` | Backend works. Admin gift tab is currently static cards and does not fetch this API. | Wire admin Gifts tab to fetch real catalog. |
| `POST /api/admin/gifts` | Backend works. UI Add New Gift button currently does not open a real create flow. | Add admin create gift modal. |
| `PATCH /api/admin/gifts/:id` | Backend works. UI Edit buttons are static. | Add edit gift modal and call this route. |
| `DELETE /api/admin/gifts/:id` | Backend works. UI has no delete action. | Add deactivate/delete control. |
| `GET /api/bonus/calculate` | Backend works. Recharge UI uses hardcoded pack values. | Use this API if packs/bonus rules become admin-controlled. |

Smoke tested admin gift routes:

- `GET /api/admin/gifts`: 200
- `POST /api/admin/gifts`: 200
- `PATCH /api/admin/gifts/:id`: 200
- `DELETE /api/admin/gifts/:id`: 200

## Legacy / Not Used By Current UI

These are not currently needed by the active Razorpay wallet flow.

| API | Why it is not used | Keep or remove? |
|---|---|---|
| `POST /api/wallet/recharge` | Old mock recharge route. Current recharge flow uses Razorpay order + verify. | Keep temporarily for fallback/testing, remove after Razorpay is stable. |
| `GET /api/payments/:transactionId/status` | Old mock payment polling. Current Razorpay checkout does not poll this route. | Legacy. |
| `POST /api/payments/:transactionId/cancel` | Mock payment cancel. Not called by UI. | Legacy. |
| `POST /api/payments/refund` | Mock refund/rollback. Not called by UI. | Legacy; replace with real refund flow later. |

## Dev/Test Only APIs

These are not used by normal user/creator/admin UI. They are useful only for call simulation/testing.

| API | Purpose |
|---|---|
| `GET /api/simulation/status` | Simulator status |
| `POST /api/simulation/toggle` | Enable/disable simulator |
| `PATCH /api/simulation/config` | Update simulator config |
| `GET /api/simulation/config` | Read simulator config |
| `POST /api/simulation/session` | Create simulated call session |
| `GET /api/simulation/session/:sessionId` | Get simulated session |
| `GET /api/simulation/sessions/active` | List active simulated sessions |
| `GET /api/simulation/sessions` | List all simulated sessions |
| `DELETE /api/simulation/session/:sessionId` | Delete simulated session |
| `POST /api/simulation/call/initiate` | Initiate simulated call |
| `POST /api/simulation/call/connect` | Connect simulated call |
| `POST /api/simulation/call/end` | End simulated call |
| `POST /api/simulation/call/fail` | Fail simulated call |
| `POST /api/simulation/call/drop` | Drop simulated call |
| `PATCH /api/simulation/call/:sessionId/quality` | Change simulated call quality |
| `PATCH /api/simulation/call/:sessionId/network` | Change simulated network state |
| `GET /api/simulation/stats` | Simulation stats |
| `POST /api/simulation/stats/reset` | Reset simulation stats |
| `DELETE /api/simulation/sessions` | Clear simulation sessions |

Recommendation:

- Keep these only in development/staging.
- Hide or disable them in production unless behind admin auth.

## Config-Dependent API

### `POST /api/zego/token`

Current status:

- Frontend uses it.
- API is structurally integrated.
- It fails if `ZEGO_SERVER_SECRET` is missing or invalid length.

Local smoke test with placeholder secret returned:

```json
{
  "error": "ZEGO_SERVER_SECRET must be 16, 24, or 32 bytes long."
}
```

This is not a route wiring bug; it means the server must have a real ZEGOCLOUD server secret configured. Required env:

```text
ZEGO_APP_ID
ZEGO_SERVER_SECRET
ZEGO_SERVER_URL
```

## APIs That Are Useless Right Now

Nothing should be deleted immediately because some routes are useful for testing or upcoming admin features. But these are not useful for current production UI:

1. Mock payment routes:
   - `POST /api/wallet/recharge`
   - `GET /api/payments/:transactionId/status`
   - `POST /api/payments/:transactionId/cancel`
   - `POST /api/payments/refund`

2. Simulation routes:
   - all `/api/simulation/*`

3. Admin gift CRUD routes are useful but currently unused because the admin UI is static.

## APIs Missing For Production UI

The following UI areas still need real backend APIs or stronger persistence:

| Feature | Missing backend work |
|---|---|
| User profile picture | Upload/resize/compress/save selected image. |
| Creator profile picture | Upload/change DP, default first media item. |
| Photos & Videos column | Creator media CRUD. |
| Language setting | Persist user/creator language to backend. |
| Blocked creators | Block/unblock/list APIs. |
| Chat with creators | Conversation/message APIs. |
| Support pinned chat | Support conversation APIs. |
| Legal documents | Admin-editable legal document APIs. |
| Random match pricing | Admin pricing API and user fetch. |
| Creator withdrawal | Payout request, wallet debit, transaction history. |
| Bank details validation | Editable/locked state and verification workflow. |
| KYC document images | Upload front/back ID document images. |
| Persistent storage | Replace in-memory maps with DB/Redis. |

## Smoke Test Results

Passed:

- Wallet create/fetch
- Wallet transaction list
- Creator status get/post
- Gifts list
- Gift send
- Call deduct success
- Call deduct insufficient balance
- User call logs
- Creator call logs
- Creator earnings
- KYC create/list
- Admin update rate
- Admin update commission
- Admin gift list/create/update/delete
- Bonus calculate
- Razorpay order create
- Simulation status/config/toggle/session create after enabling simulator

Config-dependent:

- ZEGOCLOUD token generation requires real secret.

Not tested end-to-end automatically:

- Razorpay verify, because it requires a valid `razorpay_signature` from a Checkout success event.
- Auth OTP verify with generated OTP, because OTP is generated dynamically in memory and normally read through UI/log in development.

## Recommended Cleanup Plan

1. Keep actively used APIs.
2. Wire admin gift CRUD UI to existing admin gift APIs.
3. Move simulation APIs behind development flag or admin auth.
4. Remove mock payment APIs after Razorpay has been tested end-to-end.
5. Move all in-memory stores to persistent DB/Redis:
   - wallets
   - transactions
   - Razorpay orders
   - creator statuses
   - KYC applications
   - pricing/commission
6. Add auth/ownership checks to wallet, call, gift, admin, creator APIs before production.
