import { 
  type User, 
  type InsertUser,
  type UserWallet,
  type InsertUserWallet,
  type GiftConfig,
  type InsertGiftConfig,
  type InsertGiftTransaction,
  type InsertRechargeTransaction,
  type InsertCallTransaction
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet operations
  getWallet(userId: string): Promise<UserWallet | undefined>;
  createWallet(wallet: InsertUserWallet): Promise<UserWallet>;
  updateWalletBalance(userId: string, newBalance: number): Promise<UserWallet>;
  addToWallet(userId: string, amount: number): Promise<UserWallet>;
  deductFromWallet(userId: string, amount: number): Promise<UserWallet>;
  
  // Gift operations
  getAllGifts(): Promise<GiftConfig[]>;
  getActiveGifts(): Promise<GiftConfig[]>;
  getGift(id: string): Promise<GiftConfig | undefined>;
  createGift(gift: InsertGiftConfig): Promise<GiftConfig>;
  updateGift(id: string, gift: Partial<InsertGiftConfig>): Promise<GiftConfig>;
  deleteGift(id: string): Promise<void>;
  
  // Transaction operations
  createGiftTransaction(transaction: InsertGiftTransaction): Promise<void>;
  createRechargeTransaction(transaction: InsertRechargeTransaction): Promise<void>;
  createCallTransaction(transaction: InsertCallTransaction): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, UserWallet>;
  private gifts: Map<string, GiftConfig>;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.gifts = new Map();
    
    // Initialize with default gifts
    this.initializeDefaultGifts();
  }

  private async initializeDefaultGifts() {
    const defaultGifts = [
      { amount: 20, name: "Rose", imageUrl: "rose", iconType: "Heart", sortOrder: 1, isActive: "true" },
      { amount: 40, name: "Tulip", imageUrl: "tulip", iconType: "Sparkles", sortOrder: 2, isActive: "true" },
      { amount: 50, name: "Sunflower", imageUrl: "sunflower", iconType: "Sun", sortOrder: 3, isActive: "true" },
      { amount: 100, name: "Diamond", imageUrl: "diamond", iconType: "Gem", sortOrder: 4, isActive: "true" },
      { amount: 250, name: "Crown", imageUrl: "crown", iconType: "Crown", sortOrder: 5, isActive: "true" },
      { amount: 500, name: "Star", imageUrl: "star", iconType: "Star", sortOrder: 6, isActive: "true" },
      { amount: 750, name: "Rocket", imageUrl: "rocket", iconType: "Rocket", sortOrder: 7, isActive: "true" },
      { amount: 900, name: "Trophy", imageUrl: "trophy", iconType: "Trophy", sortOrder: 8, isActive: "true" },
      { amount: 1000, name: "Universe", imageUrl: "universe", iconType: "Sparkles", sortOrder: 9, isActive: "true" },
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

  async createWallet(wallet: InsertUserWallet): Promise<UserWallet> {
    const id = randomUUID();
    const newWallet: UserWallet = {
      id,
      userId: wallet.userId,
      balance: wallet.balance || "0.00",
      updatedAt: new Date(),
    };
    this.wallets.set(wallet.userId, newWallet);
    return newWallet;
  }

  async updateWalletBalance(userId: string, newBalance: number): Promise<UserWallet> {
    let wallet = await this.getWallet(userId);
    if (!wallet) {
      wallet = await this.createWallet({ userId, balance: newBalance.toString() });
    } else {
      wallet = {
        ...wallet,
        balance: newBalance.toString(),
        updatedAt: new Date(),
      };
      this.wallets.set(userId, wallet);
    }
    return wallet;
  }

  async addToWallet(userId: string, amount: number): Promise<UserWallet> {
    let wallet = await this.getWallet(userId);
    const currentBalance = wallet ? parseFloat(wallet.balance) : 0;
    const newBalance = currentBalance + amount;
    return this.updateWalletBalance(userId, newBalance);
  }

  async deductFromWallet(userId: string, amount: number): Promise<UserWallet> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }
    const newBalance = currentBalance - amount;
    return this.updateWalletBalance(userId, newBalance);
  }

  // Gift operations
  async getAllGifts(): Promise<GiftConfig[]> {
    return Array.from(this.gifts.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getActiveGifts(): Promise<GiftConfig[]> {
    return Array.from(this.gifts.values())
      .filter(g => g.isActive === "true")
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getGift(id: string): Promise<GiftConfig | undefined> {
    return this.gifts.get(id);
  }

  async createGift(gift: InsertGiftConfig): Promise<GiftConfig> {
    const id = randomUUID();
    const newGift: GiftConfig = {
      id,
      name: gift.name,
      amount: gift.amount,
      imageUrl: gift.imageUrl,
      iconType: gift.iconType || null,
      isActive: gift.isActive || "true",
      sortOrder: gift.sortOrder || 0,
      updatedBy: gift.updatedBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      updatedAt: new Date(),
    };
    this.gifts.set(id, updatedGift);
    return updatedGift;
  }

  async deleteGift(id: string): Promise<void> {
    this.gifts.delete(id);
  }

  // Transaction operations (in-memory, just log for now)
  async createGiftTransaction(transaction: InsertGiftTransaction): Promise<void> {
    // In a real implementation, this would store in a database
    console.log("Gift transaction created:", transaction);
  }

  async createRechargeTransaction(transaction: InsertRechargeTransaction): Promise<void> {
    // In a real implementation, this would store in a database
    console.log("Recharge transaction created:", transaction);
  }

  async createCallTransaction(transaction: InsertCallTransaction): Promise<void> {
    // In a real implementation, this would store in a database
    console.log("Call transaction created:", transaction);
  }
}

export const storage = new MemStorage();
