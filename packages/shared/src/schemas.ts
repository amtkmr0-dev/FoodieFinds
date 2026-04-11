import { z } from 'zod'

/**
 * Common validation schemas for FoodieFinds
 */

// User schemas
export const userSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(50),
    password: z.string().min(6),
})

export const insertUserSchema = userSchema.pick({
    username: true,
    password: true,
})

export type User = z.infer<typeof userSchema>
export type InsertUser = z.infer<typeof insertUserSchema>

// Creator/Agent profile schemas
export const creatorAgentProfileSchema = z.object({
    id: z.string().uuid(),
    role: z.enum(['creator', 'agent']),
    mobileNumber: z.string().regex(/^[0-9]{10}$/),
    email: z.string().email().optional().nullable(),
    name: z.string().min(2).max(100),
    bankAccountNumber: z.string().optional().nullable(),
    bankIfscCode: z.string().optional().nullable(),
    bankAccountName: z.string().optional().nullable(),
    aadharNumber: z.string().optional().nullable(),
    panNumber: z.string().optional().nullable(),
    referralCode: z.string().optional().nullable(),
    referredBy: z.string().optional().nullable(),
    approvalStatus: z.enum(['pending', 'approved', 'rejected', 'banned']),
    rejectionReason: z.string().optional().nullable(),
    language: z.string().default('en'),
    randomMatchEnabled: z.enum(['true', 'false']).default('false'),
    createdAt: z.date(),
    updatedAt: z.date(),
    bannedAt: z.date().optional().nullable(),
})

export const insertCreatorAgentProfileSchema = creatorAgentProfileSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    bannedAt: true,
})

export type CreatorAgentProfile = z.infer<typeof creatorAgentProfileSchema>
export type InsertCreatorAgentProfile = z.infer<typeof insertCreatorAgentProfileSchema>

// Admin user schemas
export const adminUserSchema = z.object({
    id: z.string().uuid(),
    mobileNumber: z.string().regex(/^[0-9]{10}$/),
    name: z.string().min(2).max(100),
    email: z.string().email().optional().nullable(),
    role: z.enum(['super_user', 'admin', 'support']),
    isActive: z.enum(['true', 'false']).default('true'),
    createdAt: z.date(),
    createdBy: z.string().uuid().optional().nullable(),
})

export const insertAdminUserSchema = adminUserSchema.omit({
    id: true,
    createdAt: true,
})

export type AdminUser = z.infer<typeof adminUserSchema>
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>

// Creator pricing schemas
export const creatorPricingSchema = z.object({
    id: z.string().uuid(),
    creatorId: z.string().uuid(),
    perMinuteRate: z.number().int().min(10).max(1000),
    updatedAt: z.date(),
    updatedBy: z.string().uuid().optional().nullable(),
})

export const insertCreatorPricingSchema = creatorPricingSchema.omit({
    id: true,
    updatedAt: true,
})

export type CreatorPricing = z.infer<typeof creatorPricingSchema>
export type InsertCreatorPricing = z.infer<typeof insertCreatorPricingSchema>

// Wallet schemas
export const userWalletSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    balance: z.number().min(0),
    updatedAt: z.date(),
})

export type UserWallet = z.infer<typeof userWalletSchema>

// Call transaction schemas
export const callTransactionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    creatorId: z.string().uuid(),
    callType: z.enum(['audio', 'video']),
    durationSeconds: z.number().int().min(1),
    pricePerMinute: z.number().min(0),
    totalCost: z.number().min(0),
    createdAt: z.date(),
})

export const insertCallTransactionSchema = callTransactionSchema.omit({
    id: true,
    createdAt: true,
})

export type CallTransaction = z.infer<typeof callTransactionSchema>
export type InsertCallTransaction = z.infer<typeof insertCallTransactionSchema>

// Gift schemas
export const giftConfigSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url(),
    price: z.number().min(1),
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    createdBy: z.string().uuid().optional().nullable(),
})

export const insertGiftConfigSchema = giftConfigSchema.omit({
    id: true,
    createdAt: true,
})

export type GiftConfig = z.infer<typeof giftConfigSchema>
export type InsertGiftConfig = z.infer<typeof insertGiftConfigSchema>

// Gift transaction schemas
export const giftTransactionSchema = z.object({
    id: z.string().uuid(),
    senderId: z.string().uuid(),
    receiverId: z.string().uuid(),
    giftId: z.string().uuid(),
    quantity: z.number().int().min(1),
    totalAmount: z.number().min(0),
    message: z.string().optional().nullable(),
    createdAt: z.date(),
})

export const insertGiftTransactionSchema = giftTransactionSchema.omit({
    id: true,
    createdAt: true,
})

export type GiftTransaction = z.infer<typeof giftTransactionSchema>
export type InsertGiftTransaction = z.infer<typeof insertGiftTransactionSchema>

// Recharge transaction schemas
export const rechargeTransactionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    amount: z.number().min(100),
    paymentMethod: z.enum(['upi', 'card', 'net_banking', 'wallet']),
    status: z.enum(['pending', 'success', 'failed']),
    transactionId: z.string().optional().nullable(),
    createdAt: z.date(),
})

export type RechargeTransaction = z.infer<typeof rechargeTransactionSchema>

// Form validation schemas
export const loginSchema = z.object({
    mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Invalid mobile number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const rechargeSchema = z.object({
    amount: z.number().min(100).max(10000),
    paymentMethod: z.enum(['upi', 'card', 'net_banking', 'wallet']),
})

export const callRequestSchema = z.object({
    creatorId: z.string().uuid(),
    callType: z.enum(['audio', 'video']),
})

export const giftSendSchema = z.object({
    receiverId: z.string().uuid(),
    giftId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
    message: z.string().max(200).optional(),
})

// Utility function to validate schema
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data)
}

// Utility function to safe parse schema (returns result instead of throwing)
export function safeParseSchema<T>(schema: z.ZodSchema<T>, data: unknown): z.SafeParseReturnType<unknown, T> {
    return schema.safeParse(data)
}