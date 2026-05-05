import {
  type User,
  type InsertUser,
  type UserWallet,
  type GiftConfig,
  type InsertGiftConfig,
  type InsertGiftTransaction,
  type InsertCallTransaction,
  type RechargeTransaction,
} from "@foodiefinds/shared";
// CreatorProfile is new in this PR; import directly from @shared/schema
// (mirroring the pattern storage-drizzle.ts uses for `transactions`/`Transaction`)
// since the @foodiefinds/shared workspace re-exports may not pick it up yet.
import { type CreatorProfile } from "@shared/schema";
import { randomUUID } from "crypto";

// =====================================================================
// IStorage interface and supporting types.
//
// Manus §1.1: this file used to be MemStorage-only. The interface is now
// implemented by both `MemStorage` (below, the default for tests / no DB) and
// `DrizzleStorage` (server/storage-drizzle.ts, production-grade Postgres).
// The `storage` singleton at the bottom picks one based on `DATABASE_URL`.
// =====================================================================

// Extended type for transaction storage. Mirrors the unified `transactions`
// table added to shared/schema.ts in this PR.
export interface StoredTransaction {
  id: string;
  userId: string;
  type: 'recharge' | 'call' | 'gift' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod?: 'upi' | 'card' | 'net_banking' | 'wallet';
  transactionId: string;
  gatewayTransactionId?: string;
  bonusAmount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletOperation {
  userId: string;
  operation: 'credit' | 'debit';
  amount: number;
  transactionId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WalletOperationResult {
  success: boolean;
  wallet: UserWallet;
  transaction?: StoredTransaction;
  error?: {
    code: string;
    message: string;
  };
}

// PR #7: creator-side aggregates for the dashboard endpoint.
export interface CreatorEarningsSummary {
  todayCalls: number;
  todayEarnings: number;
  totalCalls: number;
  totalEarnings: number;
  recentCalls: Array<{
    id: string;
    userId: string;
    callType: string;
    durationSeconds: number;
    pricePerMinute: number;
    totalCost: number;
    createdAt: Date;
  }>;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Wallet operations
  getWallet(userId: string): Promise<UserWallet | undefined>;
  createWallet(userId: string, balance: number): Promise<UserWallet>;
  updateWalletBalance(userId: string, newBalance: number): Promise<UserWallet>;
  addToWallet(userId: string, amount: number): Promise<UserWallet>;
  deductFromWallet(userId: string, amount: number): Promise<UserWallet>;

  // Atomic wallet operations
  executeWalletOperation(operation: WalletOperation): Promise<WalletOperationResult>;
  rollbackTransaction(transactionId: string): Promise<boolean>;

  // Gift operations
  getAllGifts(): Promise<GiftConfig[]>;
  getActiveGifts(): Promise<GiftConfig[]>;
  getGift(id: string): Promise<GiftConfig | undefined>;
  createGift(gift: InsertGiftConfig): Promise<GiftConfig>;
  updateGift(id: string, gift: Partial<InsertGiftConfig>): Promise<GiftConfig>;
  deleteGift(id: string): Promise<void>;

  // Transaction operations
  createGiftTransaction(transaction: InsertGiftTransaction): Promise<void>;
  createRechargeTransaction(transaction: {
    userId: string;
    amount: number;
    paymentMethod: 'upi' | 'card' | 'net_banking' | 'wallet';
    status?: 'pending' | 'success' | 'failed';
    transactionId?: string;
  }): Promise<void>;
  createCallTransaction(transaction: InsertCallTransaction): Promise<void>;

  // Transaction history operations
  getTransactionHistory(userId: string, options?: {
    type?: string;
    status?: string;
    paymentMethod?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredTransaction[]>;
  getTransactionByID(transactionId: string): Promise<StoredTransaction | undefined>;
  updateTransactionStatus(transactionId: string, status: string): Promise<StoredTransaction>;

  // PR #7: Creator-public-profile operations
  getCreators(): Promise<CreatorProfile[]>;
  getCreatorById(id: string): Promise<CreatorProfile | undefined>;
  getCreatorByMobile(mobileNumber: string): Promise<CreatorProfile | undefined>;
  getCreatorEarningsSummary(creatorId: string): Promise<CreatorEarningsSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, UserWallet>;
  private gifts: Map<string, GiftConfig>;
  private transactions: Map<string, StoredTransaction>;
  private creators: Map<string, CreatorProfile>;
  private creatorsByMobile: Map<string, string>; // mobile -> creatorId index
  private walletLocks: Map<string, Promise<void>>; // For atomic operations

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.gifts = new Map();
    this.transactions = new Map();
    this.creators = new Map();
    this.creatorsByMobile = new Map();
    this.walletLocks = new Map();

    // Initialize with default gifts and creators.
    this.initializeDefaultGifts();
    this.initializeDefaultCreators();
  }

  private async initializeDefaultGifts() {
    const defaultGifts = [
      { name: "Rose", imageUrl: "rose", price: 20, isActive: true },
      { name: "Tulip", imageUrl: "tulip", price: 40, isActive: true },
      { name: "Sunflower", imageUrl: "sunflower", price: 50, isActive: true },
      { name: "Diamond", imageUrl: "diamond", price: 100, isActive: true },
      { name: "Crown", imageUrl: "crown", price: 250, isActive: true },
      { name: "Star", imageUrl: "star", price: 500, isActive: true },
      { name: "Rocket", imageUrl: "rocket", price: 750, isActive: true },
      { name: "Trophy", imageUrl: "trophy", price: 900, isActive: true },
      { name: "Universe", imageUrl: "universe", price: 1000, isActive: true },
    ];

    for (const gift of defaultGifts) {
      await this.createGift(gift as InsertGiftConfig);
    }
  }

  // PR #7: seed the same 9 demo creators that the static client/src/lib/creatorsData.ts has.
  // Mobile numbers follow the pattern 9000000001..9000000009 so OTP login is predictable.
  private initializeDefaultCreators() {
    const defaults: CreatorProfile[] = [
      {
        id: "1",
        mobileNumber: "9000000001",
        name: "Sarah Johnson",
        country: "India",
        followers: 1250,
        pricePerMinute: 45,
        isOnline: "true",
        randomMatchEnabled: "true",
        allowedCallTypes: "both",
        languages: ["English", "Hindi", "Tamil"],
        aboutMe: "Friendly conversationalist who loves discussing life experiences and offering advice on personal growth.",
        talksAbout: ["Life coaching", "Relationships", "Career guidance", "Mental wellness"],
        hobbies: ["Reading", "Yoga", "Traveling", "Cooking"],
        foodPreferences: ["Vegetarian", "Italian cuisine", "Indian sweets"],
        sportsInterests: ["Cricket", "Badminton", "Running"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        mobileNumber: "9000000002",
        name: "Rahul Verma",
        country: "India",
        followers: 890,
        pricePerMinute: 38,
        isOnline: "false",
        randomMatchEnabled: "false",
        allowedCallTypes: "video",
        languages: ["Hindi", "English"],
        aboutMe: "Tech enthusiast and startup mentor with 10 years of experience in software development.",
        talksAbout: ["Technology", "Startups", "Programming", "Career advice"],
        hobbies: ["Gaming", "Photography", "Blogging"],
        foodPreferences: ["Non-vegetarian", "North Indian", "Chinese"],
        sportsInterests: ["Football", "Chess", "Table tennis"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        mobileNumber: "9000000003",
        name: "Priya Sharma",
        country: "India",
        followers: 2100,
        pricePerMinute: 52,
        isOnline: "true",
        randomMatchEnabled: "true",
        allowedCallTypes: "both",
        languages: ["English", "Hindi", "Marathi"],
        aboutMe: "Business consultant and motivational speaker passionate about empowering entrepreneurs.",
        talksAbout: ["Business strategy", "Entrepreneurship", "Marketing", "Leadership"],
        hobbies: ["Public speaking", "Writing", "Gardening"],
        foodPreferences: ["Vegetarian", "South Indian", "Continental"],
        sportsInterests: ["Tennis", "Swimming", "Cycling"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        mobileNumber: "9000000004",
        name: "Amit Patel",
        country: "India",
        followers: 1500,
        pricePerMinute: 40,
        isOnline: "true",
        randomMatchEnabled: "false",
        allowedCallTypes: "audio",
        languages: ["Gujarati", "Hindi", "English"],
        aboutMe: "Finance expert helping people make smart investment decisions and achieve financial freedom.",
        talksAbout: ["Investment", "Stock market", "Personal finance", "Real estate"],
        hobbies: ["Reading", "Playing guitar", "Hiking"],
        foodPreferences: ["Vegetarian", "Gujarati cuisine", "Street food"],
        sportsInterests: ["Cricket", "Volleyball", "Jogging"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "5",
        mobileNumber: "9000000005",
        name: "Neha Kapoor",
        country: "India",
        followers: 1780,
        pricePerMinute: 48,
        isOnline: "true",
        randomMatchEnabled: "true",
        allowedCallTypes: "both",
        languages: ["English", "Hindi", "Punjabi"],
        aboutMe: "Fashion designer and lifestyle blogger who loves sharing creative ideas and style tips.",
        talksAbout: ["Fashion", "Lifestyle", "Beauty", "Social media"],
        hobbies: ["Sketching", "Shopping", "Dancing", "Photography"],
        foodPreferences: ["Vegetarian", "Punjabi cuisine", "Fusion food"],
        sportsInterests: ["Zumba", "Yoga", "Badminton"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "6",
        mobileNumber: "9000000006",
        name: "Vikram Singh",
        country: "India",
        followers: 750,
        pricePerMinute: 35,
        isOnline: "false",
        randomMatchEnabled: "false",
        allowedCallTypes: "video",
        languages: ["Hindi", "English"],
        aboutMe: "Fitness trainer and nutrition coach dedicated to helping people achieve their health goals.",
        talksAbout: ["Fitness", "Nutrition", "Weight loss", "Muscle building"],
        hobbies: ["Gym training", "Sports", "Cooking healthy meals"],
        foodPreferences: ["High protein", "Salads", "Smoothies"],
        sportsInterests: ["Bodybuilding", "Boxing", "Running", "Basketball"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "7",
        mobileNumber: "9000000007",
        name: "Anjali Mehta",
        country: "India",
        followers: 1320,
        pricePerMinute: 42,
        isOnline: "true",
        randomMatchEnabled: "true",
        allowedCallTypes: "audio",
        languages: ["English", "Hindi", "Bengali"],
        aboutMe: "Psychologist and counselor specializing in stress management and emotional well-being.",
        talksAbout: ["Mental health", "Stress management", "Relationships", "Self-care"],
        hobbies: ["Meditation", "Reading", "Painting", "Listening to music"],
        foodPreferences: ["Vegetarian", "Bengali cuisine", "Organic food"],
        sportsInterests: ["Walking", "Swimming", "Yoga"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "8",
        mobileNumber: "9000000008",
        name: "Karan Malhotra",
        country: "India",
        followers: 1950,
        pricePerMinute: 50,
        isOnline: "true",
        randomMatchEnabled: "false",
        allowedCallTypes: "both",
        languages: ["Hindi", "English", "Urdu"],
        aboutMe: "Digital marketing expert helping brands grow their online presence and reach their audience.",
        talksAbout: ["Digital marketing", "SEO", "Content creation", "Brand building"],
        hobbies: ["Traveling", "Photography", "Blogging", "Music"],
        foodPreferences: ["Non-vegetarian", "Mughlai", "Italian"],
        sportsInterests: ["Cricket", "Football", "Snooker"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "9",
        mobileNumber: "9000000009",
        name: "Kavya Iyer",
        country: "India",
        followers: 1650,
        pricePerMinute: 46,
        isOnline: "false",
        randomMatchEnabled: "false",
        allowedCallTypes: "video",
        languages: ["English", "Tamil", "Hindi"],
        aboutMe: "Classical dancer and arts enthusiast sharing insights on Indian culture and performing arts.",
        talksAbout: ["Dance", "Indian culture", "Arts", "Music", "Traditions"],
        hobbies: ["Dancing", "Teaching", "Traveling", "Cooking"],
        foodPreferences: ["Vegetarian", "South Indian", "Traditional sweets"],
        sportsInterests: ["Badminton", "Swimming", "Yoga"],
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const c of defaults) {
      this.creators.set(c.id, c);
      this.creatorsByMobile.set(c.mobileNumber, c.id);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Wallet operations
  async getWallet(userId: string): Promise<UserWallet | undefined> {
    return this.wallets.get(userId);
  }

  async createWallet(userId: string, balance: number): Promise<UserWallet> {
    const id = randomUUID();
    const newWallet: UserWallet = {
      id,
      userId,
      balance,
      updatedAt: new Date(),
    };
    this.wallets.set(userId, newWallet);
    return newWallet;
  }

  async updateWalletBalance(userId: string, newBalance: number): Promise<UserWallet> {
    let wallet = await this.getWallet(userId);
    if (!wallet) {
      wallet = await this.createWallet(userId, newBalance);
    } else {
      wallet = {
        ...wallet,
        balance: newBalance,
        updatedAt: new Date(),
      };
      this.wallets.set(userId, wallet);
    }
    return wallet;
  }

  async addToWallet(userId: string, amount: number): Promise<UserWallet> {
    let wallet = await this.getWallet(userId);
    const currentBalance = wallet ? wallet.balance : 0;
    const newBalance = currentBalance + amount;
    return this.updateWalletBalance(userId, newBalance);
  }

  async deductFromWallet(userId: string, amount: number): Promise<UserWallet> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const currentBalance = wallet.balance;
    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }
    const newBalance = currentBalance - amount;
    return this.updateWalletBalance(userId, newBalance);
  }

  // Atomic wallet operations with locking
  private async acquireWalletLock(userId: string): Promise<() => void> {
    // Wait for any existing operation to complete
    while (this.walletLocks.has(userId)) {
      await this.walletLocks.get(userId);
    }

    // Create a new lock promise
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.walletLocks.set(userId, lockPromise);

    // Return release function
    return () => {
      this.walletLocks.delete(userId);
      releaseLock!();
    };
  }

  async executeWalletOperation(operation: WalletOperation): Promise<WalletOperationResult> {
    const releaseLock = await this.acquireWalletLock(operation.userId);

    try {
      const wallet = await this.getWallet(operation.userId);
      if (!wallet) {
        return {
          success: false,
          wallet: {} as any,
          error: {
            code: 'INSUFFICIENT_FUNDS',
            message: 'Wallet not found',
          },
        };
      }

      const currentBalance = wallet.balance;
      let newBalance = currentBalance;

      // Execute operation
      if (operation.operation === 'credit') {
        newBalance = currentBalance + operation.amount;
      } else if (operation.operation === 'debit') {
        if (currentBalance < operation.amount) {
          return {
            success: false,
            wallet,
            error: {
              code: 'INSUFFICIENT_FUNDS',
              message: 'Insufficient balance',
            },
          };
        }
        newBalance = currentBalance - operation.amount;
      }

      // Update wallet balance
      const updatedWallet = await this.updateWalletBalance(operation.userId, newBalance);

      // Create transaction record
      const transaction: StoredTransaction = {
        id: randomUUID(),
        userId: operation.userId,
        type: operation.operation === 'credit' ? 'recharge' : 'call',
        amount: operation.amount,
        currency: 'INR',
        status: 'success',
        transactionId: operation.transactionId,
        bonusAmount: 0,
        metadata: operation.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.transactions.set(transaction.id, transaction);

      return {
        success: true,
        wallet: updatedWallet,
        transaction,
      };
    } catch (error: any) {
      return {
        success: false,
        wallet: {} as any,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message || 'Operation failed',
        },
      };
    } finally {
      releaseLock();
    }
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    const transaction = Array.from(this.transactions.values()).find(
      t => t.transactionId === transactionId
    );

    if (!transaction || transaction.status !== 'success') {
      return false;
    }

    const releaseLock = await this.acquireWalletLock(transaction.userId);

    try {
      const wallet = await this.getWallet(transaction.userId);
      if (!wallet) {
        return false;
      }

      // Reverse transaction
      const currentBalance = wallet.balance;
      let newBalance = currentBalance;

      if (transaction.type === 'recharge' || transaction.type === 'gift') {
        // Credit transactions need to be debited
        newBalance = currentBalance - transaction.amount;
      } else if (transaction.type === 'call') {
        // Debit transactions need to be credited
        newBalance = currentBalance + transaction.amount;
      }

      // Update wallet balance
      await this.updateWalletBalance(transaction.userId, newBalance);

      // Update transaction status
      transaction.status = 'refunded';
      transaction.updatedAt = new Date();
      this.transactions.set(transaction.id, transaction);

      return true;
    } catch (error) {
      return false;
    } finally {
      releaseLock();
    }
  }

  // Gift operations
  async getAllGifts(): Promise<GiftConfig[]> {
    return Array.from(this.gifts.values());
  }

  async getActiveGifts(): Promise<GiftConfig[]> {
    return Array.from(this.gifts.values())
      .filter(g => g.isActive);
  }

  async getGift(id: string): Promise<GiftConfig | undefined> {
    return this.gifts.get(id);
  }

  async createGift(gift: InsertGiftConfig): Promise<GiftConfig> {
    const id = randomUUID();
    const newGift: GiftConfig = {
      id,
      name: gift.name,
      imageUrl: gift.imageUrl,
      price: gift.price,
      isActive: gift.isActive !== undefined ? gift.isActive : true,
      createdAt: new Date(),
      createdBy: gift.createdBy || null,
    };
    this.gifts.set(id, newGift);
    return newGift;
  }

  async updateGift(id: string, giftUpdate: Partial<InsertGiftConfig>): Promise<GiftConfig> {
    const gift = await this.getGift(id);
    if (!gift) {
      throw new Error("Gift not found");
    }
    const updatedGift: GiftConfig = {
      ...gift,
      ...giftUpdate,
    };
    this.gifts.set(id, updatedGift);
    return updatedGift;
  }

  async deleteGift(id: string): Promise<void> {
    this.gifts.delete(id);
  }

  // Transaction operations
  async createGiftTransaction(transaction: InsertGiftTransaction): Promise<void> {
    const transactionRecord: StoredTransaction = {
      id: randomUUID(),
      userId: transaction.senderId,
      type: 'gift',
      amount: transaction.totalAmount,
      currency: 'INR',
      status: 'success',
      transactionId: `GIFT${Date.now()}`,
      bonusAmount: 0,
      metadata: {
        recipientId: transaction.receiverId,
        giftId: transaction.giftId,
        quantity: transaction.quantity,
        message: transaction.message,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(transactionRecord.id, transactionRecord);
  }

  async createRechargeTransaction(transaction: {
    userId: string;
    amount: number;
    paymentMethod: 'upi' | 'card' | 'net_banking' | 'wallet';
    status?: 'pending' | 'success' | 'failed';
    transactionId?: string;
  }): Promise<void> {
    const transactionRecord: StoredTransaction = {
      id: randomUUID(),
      userId: transaction.userId,
      type: 'recharge',
      amount: transaction.amount,
      currency: 'INR',
      status: transaction.status || 'pending',
      paymentMethod: transaction.paymentMethod,
      transactionId: transaction.transactionId || `RECHARGE${Date.now()}`,
      bonusAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(transactionRecord.id, transactionRecord);
  }

  async createCallTransaction(transaction: InsertCallTransaction): Promise<void> {
    const transactionRecord: StoredTransaction = {
      id: randomUUID(),
      userId: transaction.userId,
      type: 'call',
      amount: transaction.totalCost,
      currency: 'INR',
      status: 'success',
      transactionId: `CALL${Date.now()}`,
      bonusAmount: 0,
      metadata: {
        creatorId: transaction.creatorId,
        callType: transaction.callType,
        durationSeconds: transaction.durationSeconds,
        pricePerMinute: transaction.pricePerMinute,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(transactionRecord.id, transactionRecord);
  }

  // Transaction history operations
  async getTransactionHistory(userId: string, options?: {
    type?: string;
    status?: string;
    paymentMethod?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredTransaction[]> {
    let transactions = Array.from(this.transactions.values())
      .filter(t => t.userId === userId);

    // Apply filters
    if (options?.type) {
      transactions = transactions.filter(t => t.type === options.type);
    }
    if (options?.status) {
      transactions = transactions.filter(t => t.status === options.status);
    }
    if (options?.paymentMethod) {
      transactions = transactions.filter(t => t.paymentMethod === options.paymentMethod);
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return transactions.slice(offset, offset + limit);
  }

  async getTransactionByID(transactionId: string): Promise<StoredTransaction | undefined> {
    return Array.from(this.transactions.values()).find(
      t => t.transactionId === transactionId || t.id === transactionId
    );
  }

  async updateTransactionStatus(transactionId: string, status: string): Promise<StoredTransaction> {
    const transaction = await this.getTransactionByID(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = status as any;
    transaction.updatedAt = new Date();
    this.transactions.set(transaction.id, transaction);

    return transaction;
  }

  // PR #7: Creator-public-profile operations
  async getCreators(): Promise<CreatorProfile[]> {
    return Array.from(this.creators.values()).sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }

  async getCreatorById(id: string): Promise<CreatorProfile | undefined> {
    return this.creators.get(id);
  }

  async getCreatorByMobile(mobileNumber: string): Promise<CreatorProfile | undefined> {
    const id = this.creatorsByMobile.get(mobileNumber);
    return id ? this.creators.get(id) : undefined;
  }

  async getCreatorEarningsSummary(creatorId: string): Promise<CreatorEarningsSummary> {
    // Read from in-memory transactions where metadata.creatorId === creatorId.
    const calls = Array.from(this.transactions.values()).filter(
      t => t.type === 'call' && (t.metadata?.creatorId === creatorId)
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCalls = calls.filter(c => c.createdAt >= todayStart);

    return {
      todayCalls: todayCalls.length,
      todayEarnings: todayCalls.reduce((sum, c) => sum + c.amount, 0),
      totalCalls: calls.length,
      totalEarnings: calls.reduce((sum, c) => sum + c.amount, 0),
      recentCalls: calls
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          userId: c.userId,
          callType: (c.metadata?.callType as string) || 'audio',
          durationSeconds: (c.metadata?.durationSeconds as number) || 0,
          pricePerMinute: (c.metadata?.pricePerMinute as number) || 0,
          totalCost: c.amount,
          createdAt: c.createdAt,
        })),
    };
  }
}

// =====================================================================
// Storage factory (Manus §1.1)
//
// Picks `DrizzleStorage` (Postgres) when `DATABASE_URL` is set, falls back
// to `MemStorage` otherwise. The Drizzle backend is loaded lazily so the
// `@neondatabase/serverless` import doesn't run when not needed (e.g.
// during unit tests).
// =====================================================================

import { isDatabaseConfigured } from "./db";

function buildStorage(): IStorage {
    if (isDatabaseConfigured()) {
        // Lazy require so DrizzleStorage / @neondatabase/serverless is only
        // loaded when actually using a real database.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { DrizzleStorage } = require("./storage-drizzle");
        // eslint-disable-next-line no-console
        console.log("storage: using DrizzleStorage (Postgres)");
        return new DrizzleStorage();
    }
    // eslint-disable-next-line no-console
    console.log("storage: using MemStorage (in-memory; DATABASE_URL not set)");
    return new MemStorage();
}

export const storage: IStorage = buildStorage();
