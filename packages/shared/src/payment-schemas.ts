import { z } from 'zod'

/**
 * Payment processor schemas and types for FoodieFinds
 * These schemas define the structure for mock payment processing
 */

// Payment method types
export const paymentMethodSchema = z.enum(['upi', 'card', 'net_banking', 'wallet'])
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

// Transaction status types
export const transactionStatusSchema = z.enum(['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'])
export type TransactionStatus = z.infer<typeof transactionStatusSchema>

// Payment error codes
export const paymentErrorCodeSchema = z.enum([
    'INSUFFICIENT_FUNDS',
    'CARD_DECLINED',
    'NETWORK_ERROR',
    'TIMEOUT',
    'INVALID_AMOUNT',
    'INVALID_PAYMENT_METHOD',
    'DUPLICATE_TRANSACTION',
    'PROCESSING_ERROR',
    'AUTHENTICATION_FAILED',
    'RATE_LIMIT_EXCEEDED'
])
export type PaymentErrorCode = z.infer<typeof paymentErrorCodeSchema>

// Payment request schema
export const paymentRequestSchema = z.object({
    userId: z.string().uuid(),
    amount: z.number().min(1).max(100000),
    paymentMethod: paymentMethodSchema,
    currency: z.string().default('INR'),
    metadata: z.record(z.any()).optional(),
})
export type PaymentRequest = z.infer<typeof paymentRequestSchema>

// Payment response schema
export const paymentResponseSchema = z.object({
    transactionId: z.string(),
    status: transactionStatusSchema,
    amount: z.number(),
    currency: z.string(),
    paymentMethod: paymentMethodSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    gatewayResponse: z.object({
        gatewayTransactionId: z.string().optional(),
        gatewayStatus: z.string().optional(),
        gatewayMessage: z.string().optional(),
    }).optional(),
    error: z.object({
        code: paymentErrorCodeSchema,
        message: z.string(),
        details: z.string().optional(),
    }).optional(),
})
export type PaymentResponse = z.infer<typeof paymentResponseSchema>

// Payment status check request
export const paymentStatusCheckSchema = z.object({
    transactionId: z.string(),
})
export type PaymentStatusCheck = z.infer<typeof paymentStatusCheckSchema>

// Payment refund request
export const paymentRefundSchema = z.object({
    transactionId: z.string(),
    amount: z.number().min(1).optional(),
    reason: z.string().optional(),
})
export type PaymentRefund = z.infer<typeof paymentRefundSchema>

// Webhook event types
export const webhookEventTypeSchema = z.enum([
    'payment.success',
    'payment.failed',
    'payment.pending',
    'payment.processing',
    'payment.refunded',
    'payment.cancelled',
])
export type WebhookEventType = z.infer<typeof webhookEventTypeSchema>

// Webhook payload schema
export const webhookPayloadSchema = z.object({
    eventType: webhookEventTypeSchema,
    transactionId: z.string(),
    timestamp: z.string().datetime(),
    data: z.object({
        userId: z.string(),
        amount: z.number(),
        currency: z.string(),
        paymentMethod: paymentMethodSchema,
        status: transactionStatusSchema,
    }),
})
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>

// Bonus configuration schema
export const bonusConfigSchema = z.object({
    minAmount: z.number(),
    maxAmount: z.number(),
    bonusPercentage: z.number(),
    bonusAmount: z.number(),
    isActive: z.boolean(),
})
export type BonusConfig = z.infer<typeof bonusConfigSchema>

// Recharge with bonus schema
export const rechargeWithBonusSchema = z.object({
    userId: z.string().uuid(),
    amount: z.number().min(100).max(10000),
    paymentMethod: paymentMethodSchema,
    bonusApplied: z.boolean().default(false),
    bonusAmount: z.number().default(0),
})
export type RechargeWithBonus = z.infer<typeof rechargeWithBonusSchema>

// Transaction history query schema
export const transactionHistoryQuerySchema = z.object({
    userId: z.string().uuid(),
    status: transactionStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
})
export type TransactionHistoryQuery = z.infer<typeof transactionHistoryQuerySchema>

// Transaction record schema (for storage)
export const transactionRecordSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    type: z.enum(['recharge', 'call', 'gift', 'refund']),
    amount: z.number(),
    currency: z.string().default('INR'),
    status: transactionStatusSchema,
    paymentMethod: paymentMethodSchema.optional(),
    transactionId: z.string(),
    gatewayTransactionId: z.string().optional(),
    bonusAmount: z.number().default(0),
    metadata: z.record(z.any()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export type TransactionRecord = z.infer<typeof transactionRecordSchema>

// Call transaction schema with enhanced fields
export const callTransactionEnhancedSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    creatorId: z.string().uuid(),
    callType: z.enum(['audio', 'video']),
    durationSeconds: z.number().int().min(0),
    pricePerMinute: z.number().min(0),
    totalCost: z.number().min(0),
    status: transactionStatusSchema.default('success'),
    transactionId: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export type CallTransactionEnhanced = z.infer<typeof callTransactionEnhancedSchema>

// Gift transaction schema with enhanced fields
export const giftTransactionEnhancedSchema = z.object({
    id: z.string().uuid(),
    senderId: z.string().uuid(),
    recipientId: z.string().uuid(),
    giftId: z.string().uuid(),
    amount: z.number().min(0),
    status: transactionStatusSchema.default('success'),
    transactionId: z.string().optional(),
    message: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export type GiftTransactionEnhanced = z.infer<typeof giftTransactionEnhancedSchema>

// Recharge transaction schema with enhanced fields
export const rechargeTransactionEnhancedSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    amount: z.number().min(100),
    paymentMethod: paymentMethodSchema,
    status: transactionStatusSchema.default('pending'),
    transactionId: z.string().optional(),
    gatewayTransactionId: z.string().optional(),
    bonusAmount: z.number().default(0),
    totalAmount: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export type RechargeTransactionEnhanced = z.infer<typeof rechargeTransactionEnhancedSchema>

// Wallet operation schema for atomic operations
export const walletOperationSchema = z.object({
    userId: z.string().uuid(),
    operation: z.enum(['credit', 'debit']),
    amount: z.number().min(0),
    transactionId: z.string(),
    description: z.string().optional(),
    metadata: z.record(z.any()).optional(),
})
export type WalletOperation = z.infer<typeof walletOperationSchema>

// Wallet operation result
export const walletOperationResultSchema = z.object({
    success: z.boolean(),
    wallet: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        balance: z.number(),
        updatedAt: z.date(),
    }),
    transaction: transactionRecordSchema.optional(),
    error: z.object({
        code: paymentErrorCodeSchema,
        message: z.string(),
    }).optional(),
})
export type WalletOperationResult = z.infer<typeof walletOperationResultSchema>

// Payment processor configuration
export const paymentProcessorConfigSchema = z.object({
    enableSimulation: z.boolean().default(true),
    successRate: z.number().min(0).max(1).default(0.95),
    minDelay: z.number().min(0).default(500),
    maxDelay: z.number().min(0).default(3000),
    enableWebhooks: z.boolean().default(true),
    webhookDelay: z.number().min(0).default(1000),
})
export type PaymentProcessorConfig = z.infer<typeof paymentProcessorConfigSchema>

// Bonus tiers configuration
export const bonusTiersSchema = z.array(z.object({
    minAmount: z.number(),
    maxAmount: z.number(),
    bonusPercentage: z.number(),
    bonusAmount: z.number(),
    isActive: z.boolean(),
}))
export type BonusTiers = z.infer<typeof bonusTiersSchema>

// Default bonus tiers
export const DEFAULT_BONUS_TIERS: BonusTiers = [
    { minAmount: 100, maxAmount: 499, bonusPercentage: 0, bonusAmount: 0, isActive: true },
    { minAmount: 500, maxAmount: 999, bonusPercentage: 5, bonusAmount: 0, isActive: true },
    { minAmount: 1000, maxAmount: 1999, bonusPercentage: 10, bonusAmount: 0, isActive: true },
    { minAmount: 2000, maxAmount: 4999, bonusPercentage: 15, bonusAmount: 0, isActive: true },
    { minAmount: 5000, maxAmount: 10000, bonusPercentage: 20, bonusAmount: 0, isActive: true },
]

// Utility function to calculate bonus
export function calculateBonus(amount: number, tiers: BonusTiers = DEFAULT_BONUS_TIERS): number {
    const tier = tiers.find(t => amount >= t.minAmount && amount <= t.maxAmount && t.isActive)
    if (!tier) return 0

    if (tier.bonusAmount > 0) {
        return tier.bonusAmount
    }

    return Math.floor(amount * (tier.bonusPercentage / 100))
}

// Utility function to generate transaction ID
export function generateTransactionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `TXN${timestamp}${random}`.toUpperCase()
}

// Utility function to generate gateway transaction ID
export function generateGatewayTransactionId(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8)
    return `GW${timestamp}${random}`.toUpperCase()
}
