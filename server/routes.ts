import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserWalletSchema, insertGiftConfigSchema, insertGiftTransactionSchema, insertRechargeTransactionSchema, insertCallTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Wallet routes
  app.get("/api/wallet/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        // Create wallet with initial balance of 450 (matching the current mock)
        wallet = await storage.createWallet({ userId, balance: "450.00" });
      }
      
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wallet/recharge", async (req, res) => {
    try {
      const validatedData = insertRechargeTransactionSchema.parse(req.body);
      const { userId, amount, paymentMethod } = validatedData;
      
      // Add to wallet
      const wallet = await storage.addToWallet(userId, parseFloat(amount));
      
      // Create recharge transaction record
      await storage.createRechargeTransaction({
        userId,
        amount,
        paymentMethod,
        status: "success",
      });
      
      res.json({ success: true, wallet });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wallet/deduct-call", async (req, res) => {
    try {
      const validatedData = insertCallTransactionSchema.parse(req.body);
      const { userId, creatorId, durationSeconds, pricePerMinute, totalCost } = validatedData;
      
      // Deduct from wallet
      const wallet = await storage.deductFromWallet(userId, parseFloat(totalCost));
      
      // Create call transaction record
      await storage.createCallTransaction({
        userId,
        creatorId,
        durationSeconds,
        pricePerMinute,
        totalCost,
      });
      
      res.json({ success: true, wallet });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gift routes
  app.get("/api/gifts", async (req, res) => {
    try {
      const gifts = await storage.getActiveGifts();
      res.json(gifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gifts/send", async (req, res) => {
    try {
      const validatedData = insertGiftTransactionSchema.parse(req.body);
      const { senderId, recipientId, giftId, amount } = validatedData;
      
      // Deduct from sender's wallet
      await storage.deductFromWallet(senderId, amount);
      
      // Create gift transaction
      await storage.createGiftTransaction({
        senderId,
        recipientId,
        giftId,
        amount,
      });
      
      // Get updated wallet
      const wallet = await storage.getWallet(senderId);
      
      res.json({ success: true, wallet });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin gift management routes
  app.get("/api/admin/gifts", async (req, res) => {
    try {
      const gifts = await storage.getAllGifts();
      res.json(gifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/gifts", async (req, res) => {
    try {
      const validatedData = insertGiftConfigSchema.parse(req.body);
      const gift = await storage.createGift(validatedData);
      res.json(gift);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/gifts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const gift = await storage.updateGift(id, req.body);
      res.json(gift);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/gifts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGift(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
