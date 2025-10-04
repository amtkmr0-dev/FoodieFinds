import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
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
