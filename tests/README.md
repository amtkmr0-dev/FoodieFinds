# Tests

This folder is the seed for the automated-test suite called for in Manus
review §5.3 "Lack of Automated Testing". It uses [Vitest](https://vitest.dev/)
for fast, ESM-native execution that works for both the server and the
client utilities.

## Running

```bash
npm install --save-dev vitest @types/node
npx vitest run
```

The first batch of tests covers the highest-risk surfaces:

- `auth.test.ts`            JWT generation / verification
- `errorHandler.test.ts`    Centralized error middleware shape
- `shared-utils.test.ts`    Currency formatting, phone formatting

Add new tests next to the module under test (preferred) or here for
cross-cutting concerns. Use `tests/__fixtures__/` for shared fixtures.

## What still needs coverage

| Surface                                      | Priority |
|----------------------------------------------|----------|
| `server/auth.ts` requirePermission middleware| High     |
| `server/routes.ts` wallet/recharge endpoints | High     |
| `server/storage.ts` MemStorage transactions  | High     |
| `client/src/hooks/useWallet.tsx`             | Medium   |
| `client/src/pages/PaymentGatewayPage.tsx`    | Medium   |
