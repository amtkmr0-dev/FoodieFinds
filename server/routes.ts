import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGiftConfigSchema, insertGiftTransactionSchema, insertCallTransactionSchema } from "@shared/schema";
import { getMockPaymentProcessor } from "@foodiefinds/api-client";
import { calculateBonus, DEFAULT_BONUS_TIERS } from "@foodiefinds/shared";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  invalidateToken,
  authenticateToken,
  requireRole,
  authRateLimit,
  generateUUID,
  type JWTPayload
} from "./auth";

// Helper function to generate username from phone
function generateUsername(phone: string): string {
  const adjectives = ["Swift", "Bright", "Cool", "Calm", "Bold", "Quick", "Happy", "Lucky", "Keen", "Wise"];
  const nouns = ["Hawk", "Star", "Wave", "Tiger", "Eagle", "Fox", "Wolf", "Lion", "Bear", "Raven"];
  const randomNum = Math.floor(Math.random() * 9999);

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}${noun}${randomNum}`;
}

// Initialize mock payment processor
const mockPaymentProcessor = getMockPaymentProcessor({
  config: {
    enableSimulation: true,
    successRate: 0.95,
    minDelay: 500,
    maxDelay: 3000,
    enableWebhooks: true,
    webhookDelay: 1000,
  },
  onWebhook: async (payload) => {
    console.log('Payment webhook received:', payload);

    // Handle webhook events
    if (payload.eventType === 'payment.success') {
      // Update transaction status to success
      await storage.updateTransactionStatus(payload.transactionId, 'success');

      // Add bonus if applicable
      const transaction = await storage.getTransactionById(payload.transactionId);
      if (transaction && transaction.type === 'recharge') {
        const bonus = calculateBonus(transaction.amount, DEFAULT_BONUS_TIERS);
        if (bonus > 0) {
          await storage.addToWallet(payload.data.userId, bonus);
          console.log(`Bonus of ₹${bonus} added to wallet for user ${payload.data.userId}`);
        }
      }
    } else if (payload.eventType === 'payment.failed') {
      // Update transaction status to failed
      await storage.updateTransactionStatus(payload.transactionId, 'failed');
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== AUTHENTICATION ROUTES ====================

  // User signup/login with phone and OTP
  app.post("/api/auth/send-otp", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone || phone.length < 10) {
        return res.status(400).json({ error: "Invalid phone number" });
      }

      // In production, this would send an actual OTP via SMS
      // For now, we'll generate a mock OTP and store it
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in memory (in production, use Redis or database with expiration)
      (global as any).otpStore = (global as any).otpStore || new Map();
      (global as any).otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0
      });

      console.log(`OTP for ${phone}: ${otp}`); // Remove in production

      res.json({
        success: true,
        message: "OTP sent successfully",
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV !== 'production' && { otp })
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify OTP and authenticate user
  app.post("/api/auth/verify-otp", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { phone, otp, deviceId } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({ error: "Phone and OTP are required" });
      }

      // Check OTP
      (global as any).otpStore = (global as any).otpStore || new Map();
      const storedOtpData = (global as any).otpStore.get(phone);

      if (!storedOtpData) {
        return res.status(400).json({ error: "OTP expired or not found" });
      }

      if (storedOtpData.expiresAt < Date.now()) {
        (global as any).otpStore.delete(phone);
        return res.status(400).json({ error: "OTP expired" });
      }

      if (storedOtpData.otp !== otp) {
        storedOtpData.attempts++;
        if (storedOtpData.attempts >= 3) {
          (global as any).otpStore.delete(phone);
          return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
        }
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // OTP is valid, generate tokens
      const userId = deviceId || generateUUID();
      const username = generateUsername(phone);

      // Store user info (in production, save to database)
      (global as any).userStore = (global as any).userStore || new Map();
      (global as any).userStore.set(userId, {
        phone,
        username,
        deviceId: userId,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      // Generate JWT tokens
      const accessToken = generateAccessToken({ userId, role: 'user', deviceId: userId });
      const refreshToken = generateRefreshToken({ userId, role: 'user', deviceId: userId });

      // Clear OTP
      (global as any).otpStore.delete(phone);

      // Set httpOnly cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      res.json({
        success: true,
        accessToken,
        user: {
          userId,
          username,
          phone,
          role: 'user'
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Refresh access token
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token not found" });
      }

      const payload = verifyToken(refreshToken);
      if (!payload) {
        res.clearCookie('refreshToken');
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: payload.userId,
        role: payload.role,
        deviceId: payload.deviceId
      });

      res.json({ accessToken: newAccessToken });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Logout - invalidate tokens
  app.post("/api/auth/logout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        invalidateToken(token);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin login
  app.post("/api/auth/admin/login", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // In production, verify against database
      // For now, accept any admin credentials for testing
      const adminCredentials: Record<string, { password: string; role: 'admin' | 'super_user' | 'support'; name: string }> = {
        'admin': { password: 'admin123', role: 'admin', name: 'Admin User' },
        'super': { password: 'super123', role: 'super_user', name: 'Super Admin' },
        'support': { password: 'support123', role: 'support', name: 'Support Agent' }
      };

      const admin = adminCredentials[username];

      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userId = `admin_${username}`;

      // Generate JWT tokens
      const accessToken = generateAccessToken({ userId, role: admin.role });
      const refreshToken = generateRefreshToken({ userId, role: admin.role });

      // Set httpOnly cookie for refresh token
      res.cookie('adminRefreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      res.json({
        success: true,
        accessToken,
        user: {
          userId,
          username,
          role: admin.role,
          name: admin.name
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin logout
  app.post("/api/auth/admin/logout", authenticateToken, requireRole('admin', 'super_user', 'support'), async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        invalidateToken(token);
      }

      // Clear refresh token cookie
      res.clearCookie('adminRefreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify session (check if token is valid)
  app.get("/api/auth/verify", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      res.json({
        valid: true,
        user: {
          userId: user.userId,
          role: user.role,
          deviceId: user.deviceId
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== PROTECTED ROUTES ====================

  // Wallet routes (protected)
  app.get("/api/wallet/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      let wallet = await storage.getWallet(userId);

      if (!wallet) {
        // Create wallet with initial balance of 450 (matching the current mock)
        wallet = await storage.createWallet(userId, 450);
      }

      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction history routes
  app.get("/api/wallet/:userId/transactions", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { type, status, paymentMethod, limit, offset } = req.query;

      const transactions = await storage.getTransactionHistory(userId, {
        type: type as string,
        status: status as string,
        paymentMethod: paymentMethod as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Recharge route with mock payment processor
  app.post("/api/wallet/recharge", async (req: Request, res: Response) => {
    try {
      const { userId, amount, paymentMethod } = req.body;

      // Phase 5: Add Payment Validation
      // Validate required fields
      if (!userId || !amount || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // BUG-003 FIX: Validate amount is a number
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount. Amount must be a positive number." });
      }

      // Amount range validation
      const MIN_AMOUNT = 10;
      const MAX_AMOUNT = 100000;
      if (numericAmount < MIN_AMOUNT) {
        return res.status(400).json({ error: `Minimum recharge amount is ₹${MIN_AMOUNT}` });
      }
      if (numericAmount > MAX_AMOUNT) {
        return res.status(400).json({ error: `Maximum recharge amount is ₹${MAX_AMOUNT}` });
      }

      // Payment method validation
      const validPaymentMethods = ['upi', 'card', 'netbanking'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      // Duplicate payment detection (check for recent pending transactions)
      const recentTransactions = await storage.getTransactionHistory(userId, {
        status: 'pending',
        limit: 5,
      });

      const duplicateTransaction = recentTransactions.find(t =>
        t.amount === numericAmount &&
        t.paymentMethod === paymentMethod &&
        Date.now() - new Date(t.createdAt).getTime() < 60000 // Within last minute
      );

      if (duplicateTransaction) {
        return res.status(409).json({
          error: "Duplicate payment detected",
          message: "A similar payment is already being processed. Please wait or check your transaction history.",
          transactionId: duplicateTransaction.transactionId
        });
      }

      // Calculate bonus
      const bonus = calculateBonus(numericAmount, DEFAULT_BONUS_TIERS);
      const totalAmount = numericAmount + bonus;

      // Process payment through mock processor
      const paymentResponse = await mockPaymentProcessor.processPayment({
        userId,
        amount: totalAmount,
        paymentMethod,
        currency: 'INR',
        metadata: {
          originalAmount: numericAmount,
          bonusAmount: bonus,
        },
      });

      // Create pending transaction record
      // Map payment processor statuses to storage-compatible statuses
      let mappedStatus: 'pending' | 'success' | 'failed' = 'pending';
      if (paymentResponse.status === 'success') {
        mappedStatus = 'success';
      } else if (paymentResponse.status === 'failed' || paymentResponse.status === 'cancelled' || paymentResponse.status === 'refunded') {
        mappedStatus = 'failed';
      }

      await storage.createRechargeTransaction({
        userId,
        amount: totalAmount,
        paymentMethod,
        status: mappedStatus,
        transactionId: paymentResponse.transactionId,
      });

      // If payment is successful, add to wallet
      if (paymentResponse.status === 'success') {
        const wallet = await storage.addToWallet(userId, totalAmount);
        res.json({
          success: true,
          wallet,
          transaction: paymentResponse,
          bonus,
          totalAmount,
        });
      } else if (paymentResponse.status === 'pending') {
        // Return pending status for client to poll
        res.json({
          success: false,
          status: 'pending',
          transactionId: paymentResponse.transactionId,
          message: 'Payment is being processed',
        });
      } else {
        // Payment failed
        res.status(400).json({
          success: false,
          error: paymentResponse.error?.message || 'Payment failed',
          transaction: paymentResponse,
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check payment status
  app.get("/api/payments/:transactionId/status", async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const paymentStatus = await mockPaymentProcessor.getPaymentStatus({ transactionId });

      if (!paymentStatus) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(paymentStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel payment
  app.post("/api/payments/:transactionId/cancel", async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const cancelledPayment = await mockPaymentProcessor.cancelPayment(transactionId);

      // Update transaction status
      await storage.updateTransactionStatus(transactionId, 'cancelled');

      res.json({ success: true, transaction: cancelledPayment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Refund payment
  app.post("/api/payments/refund", async (req: Request, res: Response) => {
    try {
      const { transactionId, amount, reason } = req.body;

      const refundResponse = await mockPaymentProcessor.processRefund({
        transactionId,
        amount,
        reason,
      });

      // Rollback the transaction
      const rollbackSuccess = await storage.rollbackTransaction(transactionId);

      if (rollbackSuccess) {
        res.json({ success: true, transaction: refundResponse });
      } else {
        res.status(400).json({ error: "Failed to rollback transaction" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Call deduction route with atomic operations
  app.post("/api/wallet/deduct-call", async (req: Request, res: Response) => {
    try {
      const { userId, creatorId, callType, durationSeconds, pricePerMinute, totalCost } = req.body;

      if (!userId || !creatorId || !totalCost) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Use atomic wallet operation
      const result = await storage.executeWalletOperation({
        userId,
        operation: 'debit',
        amount: totalCost,
        transactionId: `CALL${Date.now()}`,
        description: `Call with ${creatorId}`,
        metadata: {
          creatorId,
          callType,
          durationSeconds,
          pricePerMinute,
        },
      });

      if (result.success) {
        // Create call transaction record
        await storage.createCallTransaction({
          userId,
          creatorId,
          callType: callType || "audio",
          durationSeconds,
          pricePerMinute,
          totalCost,
        });

        res.json({ success: true, wallet: result.wallet });
      } else {
        res.status(400).json({
          success: false,
          error: result.error?.message || 'Deduction failed',
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gift routes
  app.get("/api/gifts", async (req: Request, res: Response) => {
    try {
      const gifts = await storage.getActiveGifts();
      res.json(gifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gifts/send", async (req: Request, res: Response) => {
    try {
      const { senderId, recipientId, giftId, quantity, message } = req.body;

      if (!senderId || !recipientId || !giftId || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get gift details to calculate total amount
      const gift = await storage.getGift(giftId);
      if (!gift) {
        return res.status(404).json({ error: "Gift not found" });
      }

      const totalAmount = gift.price * quantity;

      // Use atomic wallet operation
      const result = await storage.executeWalletOperation({
        userId: senderId,
        operation: 'debit',
        amount: totalAmount,
        transactionId: `GIFT${Date.now()}`,
        description: `Gift sent to ${recipientId}`,
        metadata: {
          recipientId,
          giftId,
          quantity,
          message,
        },
      });

      if (result.success) {
        // Create gift transaction
        await storage.createGiftTransaction({
          senderId,
          receiverId: recipientId,
          giftId,
          quantity,
          totalAmount,
          message,
        });

        res.json({ success: true, wallet: result.wallet });
      } else {
        res.status(400).json({
          success: false,
          error: result.error?.message || 'Gift sending failed',
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin gift management routes
  app.get("/api/admin/gifts", async (req: Request, res: Response) => {
    try {
      const gifts = await storage.getAllGifts();
      res.json(gifts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/gifts", async (req: Request, res: Response) => {
    try {
      const validatedData = insertGiftConfigSchema.parse(req.body);
      const gift = await storage.createGift(validatedData);
      res.json(gift);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/gifts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const gift = await storage.updateGift(id, req.body);
      res.json(gift);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/gifts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteGift(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bonus calculation route
  app.get("/api/bonus/calculate", async (req: Request, res: Response) => {
    try {
      const { amount } = req.query;

      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const bonus = calculateBonus(parseFloat(amount as string), DEFAULT_BONUS_TIERS);
      const totalAmount = parseFloat(amount as string) + bonus;

      res.json({
        amount: parseFloat(amount as string),
        bonus,
        totalAmount,
        bonusPercentage: bonus > 0 ? Math.round((bonus / parseFloat(amount as string)) * 100) : 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CALL SIMULATION ROUTES ====================

  // Import call simulator
  const { getCallSimulator } = await import("./call-simulation");
  const callSimulator = getCallSimulator({
    enabled: process.env.ENABLE_CALL_SIMULATION === 'true',
    defaultCallType: 'audio',
    connectionDelay: 2000,
    maxDuration: 0,
    quality: 'good',
    networkCondition: 'good',
    dropProbability: 0.05,
    failureProbability: 0.02,
    enableBalanceCheck: true,
    minBalance: 10,
    pricePerMinute: 5,
  });

  // Get simulation status
  app.get("/api/simulation/status", (req: Request, res: Response) => {
    try {
      const status = callSimulator.getStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle simulation on/off
  app.post("/api/simulation/toggle", (req: Request, res: Response) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      callSimulator.setEnabled(enabled);
      res.json({ success: true, enabled });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update simulation configuration
  app.patch("/api/simulation/config", (req: Request, res: Response) => {
    try {
      callSimulator.updateConfig(req.body);
      res.json({ success: true, config: callSimulator.getConfig() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get simulation configuration
  app.get("/api/simulation/config", (req: Request, res: Response) => {
    try {
      res.json(callSimulator.getConfig());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new call session
  app.post("/api/simulation/session", async (req: Request, res: Response) => {
    try {
      const { userId, creatorId, callType, metadata } = req.body;

      if (!userId || !creatorId) {
        return res.status(400).json({ error: "userId and creatorId are required" });
      }

      const session = await callSimulator.createSession(
        userId,
        creatorId,
        callType || 'audio',
        metadata || {}
      );

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific session
  app.get("/api/simulation/session/:sessionId", (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = callSimulator.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all active sessions
  app.get("/api/simulation/sessions/active", (req: Request, res: Response) => {
    try {
      const sessions = callSimulator.getActiveSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all sessions
  app.get("/api/simulation/sessions", (req: Request, res: Response) => {
    try {
      const sessions = callSimulator.getAllSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a session
  app.delete("/api/simulation/session/:sessionId", (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const success = callSimulator.deleteSession(sessionId);

      if (!success) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initiate a call
  app.post("/api/simulation/call/initiate", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = await callSimulator.initiateCall(sessionId);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Connect a call
  app.post("/api/simulation/call/connect", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = await callSimulator.connectCall(sessionId);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // End a call
  app.post("/api/simulation/call/end", async (req: Request, res: Response) => {
    try {
      const { sessionId, reason } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = await callSimulator.endCall(sessionId, reason || 'user_ended');
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fail a call
  app.post("/api/simulation/call/fail", async (req: Request, res: Response) => {
    try {
      const { sessionId, reason } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = await callSimulator.failCall(sessionId, reason || 'unknown');
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Drop a call
  app.post("/api/simulation/call/drop", async (req: Request, res: Response) => {
    try {
      const { sessionId, reason } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = await callSimulator.dropCall(sessionId, reason || 'network_drop');
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update call quality
  app.patch("/api/simulation/call/:sessionId/quality", (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { quality } = req.body;

      if (!quality) {
        return res.status(400).json({ error: "quality is required" });
      }

      callSimulator.updateQuality(sessionId, quality);
      const session = callSimulator.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update network condition
  app.patch("/api/simulation/call/:sessionId/network", (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { condition } = req.body;

      if (!condition) {
        return res.status(400).json({ error: "condition is required" });
      }

      callSimulator.updateNetworkCondition(sessionId, condition);
      const session = callSimulator.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get simulation statistics
  app.get("/api/simulation/stats", (req: Request, res: Response) => {
    try {
      const stats = callSimulator.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reset simulation statistics
  app.post("/api/simulation/stats/reset", (req: Request, res: Response) => {
    try {
      callSimulator.resetStats();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear all sessions
  app.delete("/api/simulation/sessions", (req: Request, res: Response) => {
    try {
      callSimulator.clearAllSessions();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== END CALL SIMULATION ROUTES ====================

  const httpServer = createServer(app);

  return httpServer;
}
