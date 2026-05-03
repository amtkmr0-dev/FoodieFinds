/**
 * Currency formatting utilities
 *
 * Per Manus review §2.3, the formatting helpers now live in
 * `packages/shared/src/utils.ts` so the server, the user app, and the
 * creator app all share one implementation. This file is kept as a thin
 * re-export to avoid touching the dozens of existing imports across
 * `client/src/...`.
 */
export {
    formatCurrency,
    parseCurrency,
    formatCurrency as formatCurrencyLocale,
} from '@foodiefinds/shared'
