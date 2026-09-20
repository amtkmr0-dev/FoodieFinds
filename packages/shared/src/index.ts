/**
 * @foodiefinds/shared
 * Shared utilities, constants, and schemas for FoodieFinds
 */

// Export utilities
export {
    cn,
    formatCurrency,
    parseCurrency,
    formatTimeDuration,
    truncateText,
    generateId,
    debounce,
    isMobileDevice,
    getQueryParam,
    setQueryParam,
    formatPhoneNumber,
} from './utils'

// Export constants
export * from './constants'

// Export schemas
export * from './schemas'

// Export payment schemas
export * from './payment-schemas'

// Re-export commonly used types from schemas
export type {
    User,
    InsertUser,
    CreatorAgentProfile,
    InsertCreatorAgentProfile,
    AdminUser,
    InsertAdminUser,
    CreatorPricing,
    InsertCreatorPricing,
    UserWallet,
    CallTransaction,
    InsertCallTransaction,
    GiftConfig,
    InsertGiftConfig,
    GiftTransaction,
    InsertGiftTransaction,
    RechargeTransaction,
} from './schemas'

// Re-export commonly used types from constants
export type {
    Role,
    ApprovalStatus,
    CallType,
    PaymentMethod,
    CreatorCategory,
} from './constants'

// Helper functions
export { validateSchema, safeParseSchema } from './schemas'

// Version
export const VERSION = '0.1.0'