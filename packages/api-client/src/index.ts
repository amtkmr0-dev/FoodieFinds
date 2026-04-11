/**
 * @foodiefinds/api-client
 * Type-safe API client for FoodieFinds backend services
 */

// Export base client
export { BaseApiClient, apiClient } from './base-client'
export type { ApiClientConfig } from './base-client'

// Export API clients
export { WalletApi, walletApi } from './wallet-api'
export { GiftsApi, giftsApi } from './gifts-api'
export { CreatorsApi, creatorsApi } from './creators-api'
export { AuthApi, authApi } from './auth-api'

// Export mock payment processor
export { MockPaymentProcessor, getMockPaymentProcessor, resetMockPaymentProcessor } from './mock-payment-processor'
export type { PaymentProcessorOptions } from './mock-payment-processor'

// Export call simulation client
export { getCallSimulationClient, resetCallSimulationClient } from './call-simulation-client'
export type {
    CallSimulationConfig,
    CallSession,
    CallEvent,
    CallStats,
    SimulationStatus,
    CallState,
    CallQuality,
    NetworkCondition,
} from './call-simulation-client'

// Export helper functions
export {
    formatDuration,
    getQualityColor,
    getNetworkColor,
    getCallStateLabel,
    isCallActive,
    canEndCall,
    calculateCallCost,
    getRemainingTime,
    isBalanceSufficient,
} from './call-simulation-client'

// Export React Query hooks
export * from './react-query-hooks'

// Re-export types from shared package for convenience
export type {
    UserWallet,
    RechargeTransaction,
    CallTransaction,
    GiftConfig,
    GiftTransaction,
    CreatorAgentProfile,
    CreatorPricing,
    AdminUser,
    Role,
    ApprovalStatus,
    CallType,
    PaymentMethod,
} from '@foodiefinds/shared'

// Version
export const VERSION = '0.1.0'