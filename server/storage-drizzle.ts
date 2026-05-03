/**
 * Drizzle/Postgres implementation of `IStorage`.
 *
 * Activated when `DATABASE_URL` is set (see `storage.ts` factory).
 *
 * Schema mismatch handling
 * ------------------------
 * The `IStorage` interface returns Zod-derived types from `@foodiefinds/shared`
 * (e.g. `UserWallet.balance: number`, `GiftConfig.price: number`,
 * `GiftConfig.isActive: boolean`). The Drizzle schema in `shared/schema.ts`
 * uses Postgres-friendly types (`balance: decimal-as-string`,
 * `gifts.amount: integer`, `gifts.is_active: text "true"|"false"`). Each
 * mapper in this file converts a Drizzle row to the Zod-shaped value the
 * interface promises - that's the only adapter layer needed for the routes.
 *
 * Atomicity
 * ---------
 * `executeWalletOperation` and `rollbackTransaction` use a real
 * `tx.transaction(...)` with `SELECT ... FOR UPDATE` on the wallet row,
 * giving us proper concurrency safety - which `MemStorage`'s in-process
 * mutex cannot provide for multi-process deployments.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
    users,
    userWallets,
    giftsConfig,
    transactions,
    type Transaction,
} from "@shared/schema";
import {
    type User,
    type InsertUser,
    type UserWallet,
    type GiftConfig,
    type InsertGiftConfig,
    type InsertGiftTransaction,
    type InsertCallTransaction,
} from "@foodiefinds/shared";
import { getDb } from "./db";
import type {
    IStorage,
    StoredTransaction,
    WalletOperation,
    WalletOperationResult,
} from "./storage";

// ---- mappers: Drizzle row -> Zod-typed value used by IStorage --------------

function rowToWallet(row: typeof userWallets.$inferSelect): UserWallet {
    return {
        id: row.id,
        userId: row.userId,
        balance: parseFloat(row.balance),
        updatedAt: row.updatedAt,
    } as UserWallet;
}

function rowToGift(row: typeof giftsConfig.$inferSelect): GiftConfig {
    return {
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl,
        price: row.amount,
        isActive: row.isActive === "true",
        createdAt: row.createdAt,
        // The Zod schema has `createdBy` (nullable). Drizzle has `updatedBy`
        // - we surface it under `createdBy` so consumers see something
        // useful; long-term these schemas should converge.
        createdBy: row.updatedBy ?? null,
    } as GiftConfig;
}

function rowToTransaction(row: Transaction): StoredTransaction {
    return {
        id: row.id,
        userId: row.userId,
        type: row.type as StoredTransaction["type"],
        amount: parseFloat(row.amount),
        currency: row.currency,
        status: row.status as StoredTransaction["status"],
        paymentMethod: (row.paymentMethod ?? undefined) as StoredTransaction["paymentMethod"],
        transactionId: row.transactionId,
        gatewayTransactionId: row.gatewayTransactionId ?? undefined,
        bonusAmount: parseFloat(row.bonusAmount),
        metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

// ---- DrizzleStorage --------------------------------------------------------

export class DrizzleStorage implements IStorage {
    private get db() {
        return getDb();
    }

    // ---- Users ----

    async getUser(id: string): Promise<User | undefined> {
        const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
        return rows[0] as User | undefined;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const rows = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
        return rows[0] as User | undefined;
    }

    async createUser(input: InsertUser): Promise<User> {
        const [row] = await this.db
            .insert(users)
            .values({ id: randomUUID(), ...input })
            .returning();
        return row as User;
    }

    // ---- Wallets ----

    async getWallet(userId: string): Promise<UserWallet | undefined> {
        const rows = await this.db
            .select()
            .from(userWallets)
            .where(eq(userWallets.userId, userId))
            .limit(1);
        return rows[0] ? rowToWallet(rows[0]) : undefined;
    }

    async createWallet(userId: string, balance: number): Promise<UserWallet> {
        const [row] = await this.db
            .insert(userWallets)
            .values({ userId, balance: balance.toFixed(2) })
            .onConflictDoUpdate({
                target: userWallets.userId,
                set: { balance: balance.toFixed(2), updatedAt: new Date() },
            })
            .returning();
        return rowToWallet(row);
    }

    async updateWalletBalance(userId: string, newBalance: number): Promise<UserWallet> {
        // Upsert so this works even if the wallet doesn't exist yet.
        const [row] = await this.db
            .insert(userWallets)
            .values({ userId, balance: newBalance.toFixed(2) })
            .onConflictDoUpdate({
                target: userWallets.userId,
                set: { balance: newBalance.toFixed(2), updatedAt: new Date() },
            })
            .returning();
        return rowToWallet(row);
    }

    async addToWallet(userId: string, amount: number): Promise<UserWallet> {
        // Single statement, race-safe via SQL arithmetic.
        const existing = await this.getWallet(userId);
        if (!existing) {
            return this.createWallet(userId, amount);
        }
        const [row] = await this.db
            .update(userWallets)
            .set({
                balance: sql`${userWallets.balance} + ${amount.toFixed(2)}`,
                updatedAt: new Date(),
            })
            .where(eq(userWallets.userId, userId))
            .returning();
        return rowToWallet(row);
    }

    async deductFromWallet(userId: string, amount: number): Promise<UserWallet> {
        // Use a transaction with FOR UPDATE so we don't allow a negative
        // balance under concurrency. Throws on insufficient funds.
        return this.db.transaction(async (tx) => {
            const rows = await tx
                .select()
                .from(userWallets)
                .where(eq(userWallets.userId, userId))
                .for("update")
                .limit(1);
            if (rows.length === 0) {
                throw new Error("Wallet not found");
            }
            const current = parseFloat(rows[0].balance);
            if (current < amount) {
                throw new Error("Insufficient balance");
            }
            const [updated] = await tx
                .update(userWallets)
                .set({
                    balance: (current - amount).toFixed(2),
                    updatedAt: new Date(),
                })
                .where(eq(userWallets.userId, userId))
                .returning();
            return rowToWallet(updated);
        });
    }

    async executeWalletOperation(operation: WalletOperation): Promise<WalletOperationResult> {
        try {
            return await this.db.transaction(async (tx) => {
                const rows = await tx
                    .select()
                    .from(userWallets)
                    .where(eq(userWallets.userId, operation.userId))
                    .for("update")
                    .limit(1);

                if (rows.length === 0) {
                    return {
                        success: false,
                        wallet: {} as UserWallet,
                        error: { code: "INSUFFICIENT_FUNDS", message: "Wallet not found" },
                    };
                }

                const current = parseFloat(rows[0].balance);
                let next = current;
                if (operation.operation === "credit") next += operation.amount;
                else {
                    if (current < operation.amount) {
                        return {
                            success: false,
                            wallet: rowToWallet(rows[0]),
                            error: { code: "INSUFFICIENT_FUNDS", message: "Insufficient balance" },
                        };
                    }
                    next -= operation.amount;
                }

                const [updated] = await tx
                    .update(userWallets)
                    .set({ balance: next.toFixed(2), updatedAt: new Date() })
                    .where(eq(userWallets.userId, operation.userId))
                    .returning();

                const [txn] = await tx
                    .insert(transactions)
                    .values({
                        userId: operation.userId,
                        type: operation.operation === "credit" ? "recharge" : "call",
                        amount: operation.amount.toFixed(2),
                        currency: "INR",
                        status: "success",
                        transactionId: operation.transactionId,
                        bonusAmount: "0",
                        metadata: operation.metadata as any,
                    })
                    .returning();

                return {
                    success: true,
                    wallet: rowToWallet(updated),
                    transaction: rowToTransaction(txn),
                };
            });
        } catch (e: any) {
            return {
                success: false,
                wallet: {} as UserWallet,
                error: { code: "PROCESSING_ERROR", message: e?.message ?? "Operation failed" },
            };
        }
    }

    async rollbackTransaction(transactionId: string): Promise<boolean> {
        try {
            return await this.db.transaction(async (tx) => {
                const [txnRow] = await tx
                    .select()
                    .from(transactions)
                    .where(eq(transactions.transactionId, transactionId))
                    .limit(1);
                if (!txnRow || txnRow.status !== "success") return false;

                const txn = rowToTransaction(txnRow);

                const [walletRow] = await tx
                    .select()
                    .from(userWallets)
                    .where(eq(userWallets.userId, txn.userId))
                    .for("update")
                    .limit(1);
                if (!walletRow) return false;

                const current = parseFloat(walletRow.balance);
                let next = current;
                if (txn.type === "recharge" || txn.type === "gift") {
                    next = current - txn.amount;
                } else if (txn.type === "call") {
                    next = current + txn.amount;
                }

                await tx
                    .update(userWallets)
                    .set({ balance: next.toFixed(2), updatedAt: new Date() })
                    .where(eq(userWallets.userId, txn.userId));

                await tx
                    .update(transactions)
                    .set({ status: "refunded", updatedAt: new Date() })
                    .where(eq(transactions.id, txnRow.id));

                return true;
            });
        } catch {
            return false;
        }
    }

    // ---- Gifts ----

    async getAllGifts(): Promise<GiftConfig[]> {
        const rows = await this.db.select().from(giftsConfig).orderBy(giftsConfig.sortOrder);
        return rows.map(rowToGift);
    }

    async getActiveGifts(): Promise<GiftConfig[]> {
        const rows = await this.db
            .select()
            .from(giftsConfig)
            .where(eq(giftsConfig.isActive, "true"))
            .orderBy(giftsConfig.sortOrder);
        return rows.map(rowToGift);
    }

    async getGift(id: string): Promise<GiftConfig | undefined> {
        const rows = await this.db.select().from(giftsConfig).where(eq(giftsConfig.id, id)).limit(1);
        return rows[0] ? rowToGift(rows[0]) : undefined;
    }

    async createGift(gift: InsertGiftConfig): Promise<GiftConfig> {
        const [row] = await this.db
            .insert(giftsConfig)
            .values({
                amount: gift.price,
                name: gift.name,
                imageUrl: gift.imageUrl,
                iconType: gift.imageUrl, // legacy: clients pass the icon name as imageUrl
                isActive: gift.isActive === false ? "false" : "true",
                sortOrder: 0,
            })
            .returning();
        return rowToGift(row);
    }

    async updateGift(id: string, update: Partial<InsertGiftConfig>): Promise<GiftConfig> {
        const set: Record<string, unknown> = { updatedAt: new Date() };
        if (update.name !== undefined) set.name = update.name;
        if (update.imageUrl !== undefined) {
            set.imageUrl = update.imageUrl;
            set.iconType = update.imageUrl;
        }
        if (update.price !== undefined) set.amount = update.price;
        if (update.isActive !== undefined) set.isActive = update.isActive ? "true" : "false";

        const [row] = await this.db.update(giftsConfig).set(set).where(eq(giftsConfig.id, id)).returning();
        if (!row) throw new Error("Gift not found");
        return rowToGift(row);
    }

    async deleteGift(id: string): Promise<void> {
        await this.db.delete(giftsConfig).where(eq(giftsConfig.id, id));
    }

    // ---- Transaction creation ----

    async createGiftTransaction(t: InsertGiftTransaction): Promise<void> {
        await this.db.insert(transactions).values({
            userId: t.senderId,
            type: "gift",
            amount: t.totalAmount.toFixed(2),
            currency: "INR",
            status: "success",
            transactionId: `GIFT${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bonusAmount: "0",
            metadata: {
                recipientId: t.receiverId,
                giftId: t.giftId,
                quantity: t.quantity,
                message: t.message,
            } as any,
        });
    }

    async createRechargeTransaction(t: {
        userId: string;
        amount: number;
        paymentMethod: "upi" | "card" | "net_banking" | "wallet";
        status?: "pending" | "success" | "failed";
        transactionId?: string;
    }): Promise<void> {
        await this.db.insert(transactions).values({
            userId: t.userId,
            type: "recharge",
            amount: t.amount.toFixed(2),
            currency: "INR",
            status: t.status ?? "pending",
            paymentMethod: t.paymentMethod,
            transactionId: t.transactionId ?? `RECHARGE${Date.now()}`,
            bonusAmount: "0",
        });
    }

    async createCallTransaction(t: InsertCallTransaction): Promise<void> {
        await this.db.insert(transactions).values({
            userId: t.userId,
            type: "call",
            amount: t.totalCost.toFixed(2),
            currency: "INR",
            status: "success",
            transactionId: `CALL${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bonusAmount: "0",
            metadata: {
                creatorId: t.creatorId,
                callType: t.callType,
                durationSeconds: t.durationSeconds,
                pricePerMinute: t.pricePerMinute,
            } as any,
        });
    }

    // ---- Transaction queries ----

    async getTransactionHistory(
        userId: string,
        options?: {
            type?: string;
            status?: string;
            paymentMethod?: string;
            limit?: number;
            offset?: number;
        },
    ): Promise<StoredTransaction[]> {
        const conds = [eq(transactions.userId, userId)];
        if (options?.type) conds.push(eq(transactions.type, options.type));
        if (options?.status) conds.push(eq(transactions.status, options.status));
        if (options?.paymentMethod) conds.push(eq(transactions.paymentMethod, options.paymentMethod));

        const rows = await this.db
            .select()
            .from(transactions)
            .where(and(...conds))
            .orderBy(desc(transactions.createdAt))
            .limit(options?.limit ?? 20)
            .offset(options?.offset ?? 0);

        return rows.map(rowToTransaction);
    }

    async getTransactionById(transactionId: string): Promise<StoredTransaction | undefined> {
        // Match either the public transactionId (e.g. RECHARGE12345) or the
        // internal UUID, mirroring MemStorage's behavior.
        const [byTxnId] = await this.db
            .select()
            .from(transactions)
            .where(eq(transactions.transactionId, transactionId))
            .limit(1);
        if (byTxnId) return rowToTransaction(byTxnId);

        const [byId] = await this.db
            .select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .limit(1);
        return byId ? rowToTransaction(byId) : undefined;
    }

    async updateTransactionStatus(transactionId: string, status: string): Promise<StoredTransaction> {
        // Try by transactionId first, then by UUID.
        let [row] = await this.db
            .update(transactions)
            .set({ status, updatedAt: new Date() })
            .where(eq(transactions.transactionId, transactionId))
            .returning();

        if (!row) {
            [row] = await this.db
                .update(transactions)
                .set({ status, updatedAt: new Date() })
                .where(eq(transactions.id, transactionId))
                .returning();
        }

        if (!row) throw new Error("Transaction not found");
        return rowToTransaction(row);
    }
}
