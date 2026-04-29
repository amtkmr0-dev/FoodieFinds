# LINKY Backend API Documentation

Last updated: 2026-04-29

This document describes the current backend API surface for the LINKY user app, creator app, admin dashboard, payments, wallet, calls, gifts, and simulation tooling.

## Base URLs

Local:

```text
http://127.0.0.1:5090
```

Current VM:

```text
http://34.133.29.252:5082
```

Older VM IP `34.133.58.226` is currently stale and may time out.

## Response Style

Most successful responses return JSON objects or arrays. Most failed responses return:

```json
{
  "error": "Human readable error message"
}
```

Some wallet/payment operations return:

```json
{
  "success": false,
  "error": "Reason"
}
```

## Authentication

Current auth is JWT-based for user/admin routes, but many app routes are still open while the product is being integrated and tested. Production should require auth and ownership checks for wallet, creator, gift, call log, admin, and payment routes.

User access token is returned by OTP verification. Refresh token is stored in an HTTP-only cookie named `refreshToken`.

Admin access token is returned by admin login. Admin refresh token is stored in an HTTP-only cookie named `adminRefreshToken`.

## User UI Interaction to API Map

| UI interaction | API used | Purpose |
|---|---|---|
| User enters phone and taps Send OTP | `POST /api/auth/send-otp` | Generates/sends OTP for login/signup. |
| User enters OTP | `POST /api/auth/verify-otp` | Verifies OTP, creates/logs in user, returns access token. |
| User opens home/account wallet | `GET /api/wallet/:userId` | Fetches current talktime wallet balance. |
| User opens Talktime Transactions | `GET /api/wallet/:userId/transactions` | Lists recharge, call, gift, refund wallet transactions. |
| User selects recharge pack | `POST /api/razorpay/orders` | Creates Razorpay order for amount in INR. |
| Razorpay payment succeeds | `POST /api/razorpay/verify` | Verifies Razorpay signature and credits wallet. |
| User starts call | `POST /api/zego/token` | Creates ZEGOCLOUD token for room/user. |
| Creator accepts/rejects call | client call signaling plus `POST /api/creator/:creatorId/status` | Marks creator as `on_call` or `available`. |
| User/creator ends call | `POST /api/wallet/deduct-call` | Deducts call cost from user, credits creator, writes call transaction. |
| User sends gift during call | `GET /api/gifts`, `POST /api/gifts/send` | Fetches available gifts and sends one to creator. |
| User opens call logs | `GET /api/call-logs/user/:userId` | Lists user call history. |
| Creator opens call logs | `GET /api/call-logs/creator/:creatorId` | Lists creator call history. |
| Creator dashboard earnings | `GET /api/creator/:creatorId/earnings` | Returns creator wallet and call/gift totals. |
| Creator online/on-call status | `GET /api/creator/:creatorId/status` | Returns status key/value. |
| Creator applies for KYC | `POST /api/creator/applications` | Submits creator/agent onboarding application. |
| Admin reviews KYC | `GET /api/admin/kyc-applications` | Lists pending creator/agent approvals. |
| Admin approves/rejects/bans | `POST /api/admin/approve`, `POST /api/admin/reject`, `POST /api/admin/ban` | Changes application status. |
| Admin updates creator rate | `POST /api/admin/update-rate` | Updates per-minute creator price. |
| Admin updates agency commission | `POST /api/admin/update-commission` | Updates agency commission percentage. |
| Admin manages gifts | `/api/admin/gifts*` | Lists, creates, updates, deletes gift catalog. |

## Core Data Objects

### Wallet

```json
{
  "id": "wallet_uuid",
  "userId": "user_001",
  "balance": 450,
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

Creator wallets use the key format:

```text
creator_<creatorId>
```

Example:

```text
creator_8
```

### Transaction

```json
{
  "id": "uuid",
  "userId": "user_001",
  "type": "recharge | call | gift | refund",
  "amount": 250,
  "currency": "INR",
  "status": "pending | success | failed | cancelled | refunded",
  "transactionId": "RZP/CALL/GIFT id",
  "paymentMethod": "upi | card | netbanking",
  "bonusAmount": 0,
  "metadata": {},
  "createdAt": "2026-04-29T12:00:00.000Z",
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

### Creator Status

```json
{
  "creatorId": "8",
  "status": "available | on_call | offline",
  "callStatus": "available | on_call | offline",
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

### Call Log

```json
{
  "id": "CALL1777211920902",
  "userId": "user_001",
  "userName": "User",
  "creatorId": "8",
  "creatorName": "Karan Malhotra",
  "callType": "audio | video",
  "durationSeconds": 30,
  "durationLabel": "0:30",
  "pricePerMinute": 50,
  "callCost": 50,
  "giftCost": 250,
  "totalCost": 300,
  "creatorEarnings": 300,
  "status": "completed",
  "createdAt": "2026-04-29T12:00:00.000Z",
  "date": "29 Apr 2026, 12:00 pm"
}
```

## API Reference

### Realtime Calling

#### `POST /api/zego/token`

Creates a ZEGOCLOUD token for joining a call room.

Request:

```json
{
  "userId": "user_001",
  "roomId": "linky_creator_8",
  "canPublish": true
}
```

Response:

```json
{
  "appId": 415357642,
  "serverUrl": "wss://...",
  "token": "zego_token",
  "userId": "user_001",
  "roomId": "linky_creator_8",
  "expiresIn": 3600
}
```

Functionality:

- Used by user and creator call screens.
- Allows publishing/playing audio/video streams.
- Requires server env vars `ZEGO_APP_ID`, `ZEGO_SERVER_SECRET`, `ZEGO_SERVER_URL`.

### User Authentication

#### `POST /api/auth/send-otp`

Starts signup/login by generating an OTP.

Request:

```json
{
  "phone": "9717629692"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

Notes:

- OTP is returned only in non-production.
- Current OTP storage is in-memory.

#### `POST /api/auth/verify-otp`

Verifies OTP and returns authenticated user.

Request:

```json
{
  "phone": "9717629692",
  "otp": "123456",
  "deviceId": "user_001"
}
```

Response:

```json
{
  "success": true,
  "accessToken": "jwt",
  "user": {
    "userId": "user_001",
    "username": "SwiftStar123",
    "phone": "9717629692",
    "role": "user"
  }
}
```

Functionality:

- Creates user record in memory.
- Sets `refreshToken` cookie.
- Returns access token for protected calls.

#### `POST /api/auth/refresh`

Uses the `refreshToken` cookie to generate a new access token.

Response:

```json
{
  "accessToken": "jwt"
}
```

#### `POST /api/auth/logout`

Invalidates user token and clears refresh cookie.

Headers:

```text
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `GET /api/auth/verify`

Verifies access token and returns current session data.

Headers:

```text
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "valid": true,
  "user": {
    "userId": "user_001",
    "role": "user",
    "deviceId": "user_001"
  }
}
```

### Admin Authentication

#### `POST /api/auth/admin/login`

Logs in admin/super/support users.

Super user test login:

```json
{
  "phone": "9717629692",
  "otp": "123456"
}
```

Legacy admin login:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "success": true,
  "accessToken": "jwt",
  "user": {
    "userId": "super_user_9717629692",
    "username": "Super User",
    "phone": "9717629692",
    "role": "super_user",
    "name": "Super User"
  }
}
```

#### `POST /api/auth/admin/logout`

Invalidates admin token and clears admin refresh cookie.

Headers:

```text
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Creator / Agent KYC

#### `POST /api/creator/applications`

Submits creator or agent application for admin review.

Request:

```json
{
  "name": "Karan Malhotra",
  "email": "karan@example.com",
  "mobile": "9717629693",
  "role": "creator",
  "bankAccountNumber": "1234567890",
  "bankIfscCode": "SBIN0001234",
  "bankAccountName": "Karan Malhotra",
  "aadharNumber": "123412341234",
  "panNumber": "ABCDE1234F",
  "referralCode": ""
}
```

Response:

```json
{
  "success": true,
  "application": {
    "id": "creator_9717629693",
    "name": "Karan Malhotra",
    "role": "creator",
    "status": "pending"
  }
}
```

#### `GET /api/admin/kyc-applications`

Lists pending creator/agent KYC requests.

Response:

```json
{
  "creators": [],
  "agents": []
}
```

#### `POST /api/admin/approve`

Approves an application.

Request:

```json
{
  "id": "creator_9717629693"
}
```

#### `POST /api/admin/reject`

Rejects an application.

Request:

```json
{
  "id": "creator_9717629693",
  "reason": "PAN mismatch"
}
```

#### `POST /api/admin/ban`

Bans an application/account.

Request:

```json
{
  "id": "creator_9717629693"
}
```

#### `POST /api/admin/update-rate`

Updates creator per-minute rate.

Request:

```json
{
  "creatorId": "creator_9717629693",
  "rate": 75
}
```

Response:

```json
{
  "success": true,
  "creatorId": "creator_9717629693",
  "rate": 75,
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

Validation:

- Minimum: `10`
- Maximum: `500`

#### `POST /api/admin/update-commission`

Updates agency commission percentage.

Request:

```json
{
  "agencyId": "agent_9717629694",
  "commission": 35
}
```

Response:

```json
{
  "success": true,
  "agencyId": "agent_9717629694",
  "commission": 35,
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

Validation:

- Minimum: `1`
- Maximum: `80`

### Wallet

#### `GET /api/wallet/:userId`

Gets or creates a user wallet.

Example:

```text
GET /api/wallet/user_001
```

Response:

```json
{
  "id": "uuid",
  "userId": "user_001",
  "balance": 450,
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

Current default starting balance is `450`.

#### `GET /api/wallet/:userId/transactions`

Lists wallet transactions.

Query params:

| Param | Type | Description |
|---|---|---|
| `type` | string | `recharge`, `call`, `gift`, `refund` |
| `status` | string | `pending`, `success`, `failed`, `cancelled`, `refunded` |
| `paymentMethod` | string | `upi`, `card`, `netbanking`, `wallet` |
| `limit` | number | Page size |
| `offset` | number | Offset |

Example:

```text
GET /api/wallet/user_001/transactions?type=gift&limit=20
```

### Razorpay Payments

#### `POST /api/razorpay/orders`

Creates a Razorpay order for wallet recharge.

Request:

```json
{
  "userId": "user_001",
  "amount": 100,
  "paymentMethod": "upi"
}
```

Response:

```json
{
  "success": true,
  "keyId": "rzp_test_xxx",
  "orderId": "order_xxx",
  "amount": 10000,
  "currency": "INR",
  "receipt": "rcpt_1777212727469",
  "bonus": 0,
  "totalAmount": 100
}
```

Functionality:

- Converts INR to paise.
- Calls Razorpay Orders API.
- Stores pending order in memory.
- Does not credit wallet yet.

#### `POST /api/razorpay/verify`

Verifies Razorpay payment signature and credits wallet.

Request:

```json
{
  "userId": "user_001",
  "paymentMethod": "upi",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature"
}
```

Response:

```json
{
  "success": true,
  "wallet": {
    "userId": "user_001",
    "balance": 550
  },
  "transaction": {
    "transactionId": "pay_xxx",
    "status": "success",
    "paymentMethod": "upi",
    "amount": 100,
    "currency": "INR",
    "razorpayOrderId": "order_xxx"
  },
  "bonus": 0,
  "totalAmount": 100,
  "status": "success",
  "transactionId": "pay_xxx",
  "message": "Payment verified and wallet credited."
}
```

Functionality:

- Computes HMAC SHA-256 using Razorpay secret.
- Verifies `order_id|payment_id` signature.
- Creates recharge transaction.
- Credits user wallet.
- Is idempotent for already-paid orders.

### Legacy Mock Payment APIs

These still exist for testing/backward compatibility. New recharge UI should prefer Razorpay.

#### `POST /api/wallet/recharge`

Processes wallet recharge through mock payment processor.

Request:

```json
{
  "userId": "user_001",
  "amount": 100,
  "paymentMethod": "upi"
}
```

#### `GET /api/payments/:transactionId/status`

Gets mock payment status.

#### `POST /api/payments/:transactionId/cancel`

Cancels mock payment and marks transaction cancelled.

#### `POST /api/payments/refund`

Refunds mock payment and rolls back wallet transaction.

Request:

```json
{
  "transactionId": "TXN123",
  "amount": 100,
  "reason": "duplicate_payment"
}
```

### Calls and Billing

#### `POST /api/wallet/deduct-call`

Ends/bills a call. Deducts only call minutes from user wallet and credits creator wallet. Gift cost is not deducted here because gifts are deducted immediately by `/api/gifts/send`.

Request:

```json
{
  "userId": "user_001",
  "userName": "Amit",
  "creatorId": "8",
  "creatorName": "Karan Malhotra",
  "callType": "video",
  "durationSeconds": 30,
  "pricePerMinute": 50,
  "callCost": 50,
  "giftCost": 250,
  "totalCost": 300
}
```

Response:

```json
{
  "success": true,
  "wallet": {
    "userId": "user_001",
    "balance": 150
  },
  "creatorWallet": {
    "userId": "creator_8",
    "balance": 300
  },
  "transactionId": "CALL1777211920902"
}
```

Functionality:

- Uses atomic debit operation.
- Prevents negative balances.
- Records transaction type `call`.
- Adds call amount to creator wallet.
- Stores metadata for user/creator call logs.

#### `GET /api/call-logs/user/:userId`

Returns user call logs from call transactions.

#### `GET /api/call-logs/creator/:creatorId`

Returns creator call logs.

#### `GET /api/creator/:creatorId/earnings`

Returns creator wallet and totals.

Response:

```json
{
  "wallet": {
    "userId": "creator_8",
    "balance": 300
  },
  "balance": 300,
  "totals": {
    "calls": 50,
    "gifts": 250,
    "all": 300
  }
}
```

#### `GET /api/creator/:creatorId/status`

Returns creator availability/call status.

Response:

```json
{
  "creatorId": "8",
  "status": "available",
  "callStatus": "available",
  "updatedAt": "2026-04-29T12:00:00.000Z"
}
```

#### `POST /api/creator/:creatorId/status`

Updates creator availability/call status.

Request:

```json
{
  "status": "on_call"
}
```

Valid statuses:

- `available`
- `on_call`
- `offline`

### Gifts

#### `GET /api/gifts`

Returns active gift catalog for user gift modal.

#### `POST /api/gifts/send`

Sends a gift from user to creator.

Request:

```json
{
  "senderId": "user_001",
  "recipientId": "8",
  "giftId": "gift_id",
  "quantity": 1,
  "message": "Nice call"
}
```

Response:

```json
{
  "success": true,
  "wallet": {
    "userId": "user_001",
    "balance": 200
  },
  "amount": 250
}
```

Functionality:

- Validates gift.
- Debits sender wallet immediately.
- Records transaction type `gift`.
- Credits creator wallet immediately.

### Admin Gift Management

#### `GET /api/admin/gifts`

Lists all gifts, active and inactive.

#### `POST /api/admin/gifts`

Creates gift config.

Request:

```json
{
  "name": "Crown",
  "imageUrl": "crown",
  "iconType": "Crown",
  "amount": 250,
  "isActive": "true",
  "sortOrder": 5
}
```

#### `PATCH /api/admin/gifts/:id`

Updates gift config.

#### `DELETE /api/admin/gifts/:id`

Deletes gift config.

### Bonus

#### `GET /api/bonus/calculate?amount=1000`

Calculates wallet recharge bonus.

Response:

```json
{
  "amount": 1000,
  "bonus": 150,
  "totalAmount": 1150,
  "bonusPercentage": 15
}
```

### Call Simulation APIs

These APIs are testing/dev tooling for simulated calls.

#### `GET /api/simulation/status`

Returns simulator status.

#### `POST /api/simulation/toggle`

Request:

```json
{
  "enabled": true
}
```

Turns simulator on/off.

#### `GET /api/simulation/config`

Returns simulator config.

#### `PATCH /api/simulation/config`

Updates simulator config.

#### `POST /api/simulation/session`

Creates simulated call session.

Request:

```json
{
  "userId": "user_001",
  "creatorId": "8",
  "callType": "video",
  "metadata": {}
}
```

#### `GET /api/simulation/session/:sessionId`

Gets a simulated session.

#### `GET /api/simulation/sessions/active`

Lists active simulated sessions.

#### `GET /api/simulation/sessions`

Lists all simulated sessions.

#### `DELETE /api/simulation/session/:sessionId`

Deletes a simulated session.

#### `POST /api/simulation/call/initiate`

Initiates simulated call.

Request:

```json
{
  "sessionId": "session_id"
}
```

#### `POST /api/simulation/call/connect`

Connects simulated call.

#### `POST /api/simulation/call/end`

Ends simulated call.

Request:

```json
{
  "sessionId": "session_id",
  "reason": "user_ended"
}
```

#### `POST /api/simulation/call/fail`

Marks simulated call failed.

#### `POST /api/simulation/call/drop`

Drops simulated call due to network/reason.

#### `PATCH /api/simulation/call/:sessionId/quality`

Request:

```json
{
  "quality": "good"
}
```

#### `PATCH /api/simulation/call/:sessionId/network`

Request:

```json
{
  "condition": "good"
}
```

#### `GET /api/simulation/stats`

Returns simulator stats.

#### `POST /api/simulation/stats/reset`

Resets simulator stats.

#### `DELETE /api/simulation/sessions`

Clears all simulator sessions.

## Recommended Backend Structure For Full Production

The current app still has several frontend/localStorage-only interactions. These should be moved to backend APIs before production.

### Recommended Modules

```text
server/
  modules/
    auth/
      auth.routes.ts
      auth.service.ts
    users/
      users.routes.ts
      users.service.ts
    creators/
      creators.routes.ts
      creators.service.ts
    wallet/
      wallet.routes.ts
      wallet.service.ts
      wallet-ledger.service.ts
    payments/
      razorpay.routes.ts
      razorpay.service.ts
      payment-webhooks.routes.ts
    calls/
      calls.routes.ts
      call-billing.service.ts
      call-signaling.service.ts
    chat/
      chats.routes.ts
      messages.routes.ts
    gifts/
      gifts.routes.ts
      gifts.service.ts
    admin/
      admin.routes.ts
    legal/
      legal.routes.ts
```

### Recommended Missing APIs

These are not fully implemented yet but are needed for a clean end-to-end backend.

| UI area | Recommended API | Functionality |
|---|---|---|
| User profile picture | `POST /api/users/:userId/profile-picture` | Upload, resize/compress, save selected avatar/gallery image. |
| Creator profile picture | `POST /api/creators/:creatorId/profile-picture` | Upload/update creator DP, default first media item as DP. |
| Creator gallery | `GET/POST/DELETE /api/creators/:creatorId/media` | Manage Photos & Videos column. |
| Language setting | `PATCH /api/users/:userId/settings` | Persist language; frontend reads selected locale on login. |
| Creator language setting | `PATCH /api/creators/:creatorId/settings` | Persist creator language preference. |
| User blocks creator | `POST /api/users/:userId/blocked-creators` | Block creator. |
| Unblock creator | `DELETE /api/users/:userId/blocked-creators/:creatorId` | Unblock creator. |
| Blocked creators list | `GET /api/users/:userId/blocked-creators` | List blocked creators. |
| Chat conversations | `GET /api/users/:userId/conversations` | List support + creator conversations. |
| Creator chat | `POST /api/conversations/:conversationId/messages` | Send message to creator, not support. |
| First recharge chat gate | `GET /api/users/:userId/eligibility/chat` | Backend tells whether user can chat. |
| Legal documents | `GET /api/legal-documents`, `GET /api/legal-documents/:slug` | User reads admin-managed docs. |
| Admin legal editor | `POST/PATCH /api/admin/legal-documents/:slug` | Admin updates policy pages. |
| Random match price | `GET/PATCH /api/admin/pricing/random-match` | Admin controls random match price. |
| Creator withdraw | `POST /api/creators/:creatorId/withdrawals` | Deduct creator wallet, create payout record. |
| Creator bank details | `GET/PATCH /api/creators/:creatorId/bank-details` | Edit only when unlocked; validate before verified. |
| KYC document images | `POST /api/creator/applications/:id/documents` | Upload front/back ID images. |
| Beauty filter setting | `PATCH /api/creators/:creatorId/settings` | Save beauty filter preference. |

## Important Current Limitations

1. Storage is in-memory. Data resets when the server restarts.
2. Many routes do not enforce auth/ownership yet.
3. Razorpay orders are stored in memory, so payment verification can fail after restart.
4. Creator status is in-memory and should be persisted or backed by Redis for real-time production use.
5. Chat, block, profile picture upload, legal document admin editing, persistent settings, and media management need dedicated backend APIs.

## Recommended Persistence Tables

```text
users
creators
creator_applications
creator_documents
wallets
wallet_transactions
payment_orders
call_sessions
call_logs
gift_catalog
gift_transactions
creator_status
conversations
messages
blocked_creators
legal_documents
settings
withdrawals
bank_accounts
```
