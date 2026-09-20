import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const creatorAgentProfiles = pgTable("creator_agent_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // "creator" or "agent"
  mobileNumber: text("mobile_number").notNull().unique(),
  email: text("email"),
  name: text("name").notNull(),

  // KYC Details
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankAccountName: text("bank_account_name"),
  aadharNumber: text("aadhar_number"),
  panNumber: text("pan_number"),

  // Referral
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),

  // Approval Status
  approvalStatus: text("approval_status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "banned"
  rejectionReason: text("rejection_reason"),

  // Language
  language: text("language").default("en"),

  // Random Match Settings
  randomMatchEnabled: text("random_match_enabled").notNull().default("false"), // "true" | "false"

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  bannedAt: timestamp("banned_at"),
});

export const insertCreatorAgentProfileSchema = createInsertSchema(creatorAgentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCreatorAgentProfile = z.infer<typeof insertCreatorAgentProfileSchema>;
export type CreatorAgentProfile = typeof creatorAgentProfiles.$inferSelect;

// Admin Users table with role-based access
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mobileNumber: text("mobile_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull(), // "super_user" | "admin" | "support"
  isActive: text("is_active").notNull().default("true"), // "true" | "false"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by"), // References admin_users.id
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Creator Pricing table
export const creatorPricing = pgTable("creator_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(), // References creatorAgentProfiles.id
  perMinuteRate: integer("per_minute_rate").notNull(), // in INR
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"), // References admin_users.id
});

export const insertCreatorPricingSchema = createInsertSchema(creatorPricing).omit({
  id: true,
  updatedAt: true,
});

export type InsertCreatorPricing = z.infer<typeof insertCreatorPricingSchema>;
export type CreatorPricing = typeof creatorPricing.$inferSelect;

// Agency Commission table
export const agencyCommission = pgTable("agency_commission", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull(), // References creatorAgentProfiles.id
  commissionRate: integer("commission_rate").notNull(), // percentage (e.g., 20 for 20%)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"), // References admin_users.id
});

export const insertAgencyCommissionSchema = createInsertSchema(agencyCommission).omit({
  id: true,
  updatedAt: true,
});

export type InsertAgencyCommission = z.infer<typeof insertAgencyCommissionSchema>;
export type AgencyCommission = typeof agencyCommission.$inferSelect;

// User Wallets table
export const userWallets = pgTable("user_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(), // User identifier (phone number or user ID)
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type UserWallet = typeof userWallets.$inferSelect;

// Gifts Configuration table
export const giftsConfig = pgTable("gifts_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: integer("amount").notNull(), // Gift amount in INR
  name: text("name").notNull(), // Gift name (e.g., "Rose", "Diamond")
  imageUrl: text("image_url").notNull(), // URL or path to gift image/icon
  iconType: text("icon_type"), // Icon identifier if using icon library
  isActive: text("is_active").notNull().default("true"), // "true" | "false"
  sortOrder: integer("sort_order").notNull().default(0), // Display order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"), // References admin_users.id
});

export const insertGiftConfigSchema = createInsertSchema(giftsConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGiftConfig = z.infer<typeof insertGiftConfigSchema>;
export type GiftConfig = typeof giftsConfig.$inferSelect;

// Gift Transactions table
export const giftTransactions = pgTable("gift_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: text("sender_id").notNull(), // User who sent the gift
  recipientId: text("recipient_id").notNull(), // Creator who received the gift
  giftId: varchar("gift_id").notNull(), // References giftsConfig.id
  amount: integer("amount").notNull(), // Amount in INR
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGiftTransactionSchema = createInsertSchema(giftTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertGiftTransaction = z.infer<typeof insertGiftTransactionSchema>;
export type GiftTransaction = typeof giftTransactions.$inferSelect;

// Recharge Transactions table
export const rechargeTransactions = pgTable("recharge_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // User who recharged
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Recharge amount
  paymentMethod: text("payment_method").notNull(), // upi, card, netbanking
  status: text("status").notNull().default("pending"), // pending, success, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRechargeTransactionSchema = createInsertSchema(rechargeTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertRechargeTransaction = z.infer<typeof insertRechargeTransactionSchema>;
export type RechargeTransaction = typeof rechargeTransactions.$inferSelect;

// Call Transactions table
export const callTransactions = pgTable("call_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // User who made the call
  creatorId: text("creator_id").notNull(), // Creator who received the call
  callType: text("call_type").notNull().default("audio"), // "audio" or "video"
  durationSeconds: integer("duration_seconds").notNull(), // Call duration in seconds
  pricePerMinute: integer("price_per_minute").notNull(), // Rate at the time of call
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(), // Total cost charged
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCallTransactionSchema = createInsertSchema(callTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertCallTransaction = z.infer<typeof insertCallTransactionSchema>;
export type CallTransaction = typeof callTransactions.$inferSelect;

// Detailed Call Logs for performance tracking
export const callLogs = pgTable("call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callerId: text("caller_id").notNull(), // User ID
  receiverId: text("receiver_id").notNull(), // Creator ID
  callType: text("call_type").notNull().default("audio"), // "audio" or "video"
  status: text("status").notNull(), // "initiated", "answered", "rejected", "missed", "cancelled_by_user_early", "completed"
  durationSeconds: integer("duration_seconds").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
});

export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type CallLog = typeof callLogs.$inferSelect;

// Creator Performance Metrics table
export const creatorPerformance = pgTable("creator_performance", {
  creatorId: varchar("creator_id").primaryKey(), // References creatorAgentProfiles.id
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }).notNull().default("0.00"),
  totalCalls: integer("total_calls").notNull().default(0),
  answeredCalls: integer("answered_calls").notNull().default(0),
  rejectedCalls: integer("rejected_calls").notNull().default(0),
  missedCalls: integer("missed_calls").notNull().default(0),
  avgCallDurationSeconds: integer("avg_call_duration_seconds").notNull().default(0),
  userRetentionRate: decimal("user_retention_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCreatorPerformanceSchema = createInsertSchema(creatorPerformance).omit({
  updatedAt: true,
});

export type InsertCreatorPerformance = z.infer<typeof insertCreatorPerformanceSchema>;
export type CreatorPerformance = typeof creatorPerformance.$inferSelect;

// Creator Rewards table
export const creatorRewards = pgTable("creator_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(), // References creatorAgentProfiles.id
  rewardType: text("reward_type").notNull(), // "daily_top_performer", "weekly_top_performer", "referral_bonus"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("distributed"), // "pending", "distributed"
  distributedAt: timestamp("distributed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCreatorRewardSchema = createInsertSchema(creatorRewards).omit({
  id: true,
  createdAt: true,
});

export type InsertCreatorReward = z.infer<typeof insertCreatorRewardSchema>;
export type CreatorReward = typeof creatorRewards.$inferSelect;

// =====================================================================
// Unified transactions table (Manus §1.1 Drizzle migration)
//
// The IStorage interface in server/storage.ts uses a single `StoredTransaction`
// type covering recharge / call / gift / refund. The 4 specialized tables
// above (giftTransactions, rechargeTransactions, callTransactions, callLogs)
// remain for analytics, but this table is the source of truth for the
// generic transaction-history endpoint and the wallet rollback flow.
// =====================================================================
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'recharge' | 'call' | 'gift' | 'refund'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull(), // 'pending'|'processing'|'success'|'failed'|'cancelled'|'refunded'
  paymentMethod: text("payment_method"), // 'upi'|'card'|'net_banking'|'wallet'
  transactionId: text("transaction_id").notNull().unique(),
  gatewayTransactionId: text("gateway_transaction_id"),
  bonusAmount: decimal("bonus_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// =====================================================================
// Creator profiles (PR #7: end-to-end demo wiring)
//
// This is the PUBLIC-FACING creator listing — what users browse on the
// home page and view on /user/creator/:id. Mirrors the static
// `client/src/lib/creatorsData.ts` shape so the frontend can swap to
// API-backed data with no UI changes.
//
// Intentionally separate from `creator_agent_profiles` (the production-grade
// KYC/approval table). They overlap on (mobileNumber, name) and should
// converge in a future schema unification PR — for now, the demo uses this
// simpler table and seeds 9 creators that match the existing static data.
// =====================================================================
export const creatorProfiles = pgTable("creator_profiles", {
  // ID is set explicitly (not defaulted to gen_random_uuid) so we can
  // match the static creatorsData.ts IDs ("1" through "9").
  id: varchar("id").primaryKey(),
  mobileNumber: text("mobile_number").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull().default("India"),
  followers: integer("followers").notNull().default(0),
  pricePerMinute: integer("price_per_minute").notNull(),
  // Stored as text "true"/"false" for consistency with other boolean-ish columns.
  isOnline: text("is_online").notNull().default("true"),
  randomMatchEnabled: text("random_match_enabled").notNull().default("false"),
  // 'audio' | 'video' | 'both'
  allowedCallTypes: text("allowed_call_types").notNull().default("both"),
  // Arrays stored as JSONB.
  languages: jsonb("languages").notNull().default(sql`'[]'::jsonb`),
  aboutMe: text("about_me"),
  talksAbout: jsonb("talks_about"),
  hobbies: jsonb("hobbies"),
  foodPreferences: jsonb("food_preferences"),
  sportsInterests: jsonb("sports_interests"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCreatorProfileSchema = createInsertSchema(creatorProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertCreatorProfile = z.infer<typeof insertCreatorProfileSchema>;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
