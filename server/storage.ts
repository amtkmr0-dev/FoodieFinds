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
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

// Extended types for transaction storage
interface StoredTransaction {
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

interface WalletOperation {
  userId: string;
  operation: 'credit' | 'debit';
  amount: number;
  transactionId: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface WalletOperationResult {
  success: boolean;
  wallet: UserWallet;
  transaction?: StoredTransaction;
  error?: {
    code: string;
    message: string;
  };
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
  getTransactionById(transactionId: string): Promise<StoredTransaction | undefined>;
  updateTransactionStatus(transactionId: string, status: string): Promise<StoredTransaction>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, UserWallet>;
  private gifts: Map<string, GiftConfig>;
  private transactions: Map<string, StoredTransaction>;
  private walletLocks: Map<string, Promise<void>>; // For atomic operations

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.gifts = new Map();
    this.transactions = new Map();
    this.walletLocks = new Map();

    // Initialize with default gifts
    this.initializeDefaultGifts();
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

  async getTransactionById(transactionId: string): Promise<StoredTransaction | undefined> {
    return Array.from(this.transactions.values()).find(
      t => t.transactionId === transactionId || t.id === transactionId
    );
  }

  async updateTransactionStatus(transactionId: string, status: string): Promise<StoredTransaction> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = status as any;
    transaction.updatedAt = new Date();
    this.transactions.set(transaction.id, transaction);

    return transaction;
  }
}

export const storage = new MemStorage();
