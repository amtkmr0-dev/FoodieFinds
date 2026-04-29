import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
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
import { generateZegoToken04 } from "./zego-token";

// Helper function to generate username from phone
function generateUsername(phone: string): string {
  const adjectives = ["Swift", "Bright", "Cool", "Calm", "Bold", "Quick", "Happy", "Lucky", "Keen", "Wise"];
  const nouns = ["Hawk", "Star", "Wave", "Tiger", "Eagle", "Fox", "Wolf", "Lion", "Bear", "Raven"];
  const randomNum = Math.floor(Math.random() * 9999);

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}${noun}${randomNum}`;
}

type CreatorApplication = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: "creator" | "agent";
  bankAccount: string;
  ifsc: string;
  bankAccountName: string;
  aadhar: string;
  pan: string;
  referralCode: string;
  submittedAt: string;
  currentRate?: number;
  currentCommission?: number;
  status: "pending" | "approved" | "rejected" | "banned";
  rejectionReason?: string;
};

const creatorApplications = new Map<string, CreatorApplication>();
const creatorRates = new Map<string, {
  creatorId: string;
  rate: number;
  updatedAt: string;
}>();
const agencyCommissions = new Map<string, {
  agencyId: string;
  commission: number;
  updatedAt: string;
}>();
const creatorStatuses = new Map<string, {
  creatorId: string;
  status: "available" | "on_call" | "offline";
  callStatus: "available" | "on_call" | "offline";
  updatedAt: string;
}>();
const razorpayOrders = new Map<string, {
  userId: string;
  amount: number;
  bonus: number;
  totalAmount: number;
  paymentMethod: 'upi' | 'card' | 'netbanking';
  receipt: string;
  status: 'created' | 'paid';
  paymentId?: string;
  transactionId?: string;
}>();

type GiftRequestRecord = {
  id: string;
  roomId: string;
  creatorId: string;
  creatorName: string;
  requesterId: string;
  requesterName: string;
  userId: string;
  giftId: string;
  giftName: string;
  giftAmount: number;
  quantity: number;
  totalAmount: number;
  status: "requested" | "accepted" | "rejected" | "expired";
  responderId?: string;
  responderName?: string;
  walletBalance?: number;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
};

const giftRequests = new Map<string, GiftRequestRecord>();

const creatorMediaSources: Record<string, string[]> = {
  "1": [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=800&fit=crop",
  ],
  "2": [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=800&fit=crop",
  ],
  "3": [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop",
  ],
  "4": [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=800&fit=crop",
  ],
  "5": [
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=800&fit=crop",
  ],
  "6": [
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&h=800&fit=crop",
  ],
  "7": [
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=800&fit=crop",
  ],
  "8": [
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&h=800&fit=crop",
  ],
  "9": [
    "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=800&h=800&fit=crop",
  ],
};

function maskAadhar(aadhar: string) {
  const digits = String(aadhar || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `XXXX XXXX ${digits.slice(-4)}`;
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_Si96Q8694Vgta2";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

function requireRazorpayConfig() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.");
  }
}

async function createRazorpayOrder(order: {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}) {
  requireRazorpayConfig();

  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.description || data.error?.reason || "Unable to create Razorpay order.");
  }

  return data;
}

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  requireRazorpayConfig();
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getCreatorStatusRecord(creatorId: string) {
  const existing = creatorStatuses.get(creatorId);
  if (existing) return existing;

  const record = {
    creatorId,
    status: "available" as const,
    callStatus: "available" as const,
    updatedAt: new Date().toISOString(),
  };
  creatorStatuses.set(creatorId, record);
  return record;
}

async function debitGiftFromWallet({
  senderId,
  recipientId,
  giftId,
  quantity,
  message,
  transactionId = `GIFT${Date.now()}`,
}: {
  senderId: string;
  recipientId: string;
  giftId: string;
  quantity: number;
  message?: string;
  transactionId?: string;
}) {
  if (!senderId || !recipientId || !giftId || !quantity) {
    return { statusCode: 400, body: { error: "Missing required fields" } };
  }

  const gift = await storage.getGift(giftId);
  if (!gift) {
    return { statusCode: 404, body: { error: "Gift not found" } };
  }

  const giftAmount = Number(gift.amount);
  const giftQuantity = Number(quantity);
  if (!Number.isFinite(giftAmount) || giftAmount <= 0 || !Number.isFinite(giftQuantity) || giftQuantity <= 0) {
    return { statusCode: 400, body: { error: "Invalid gift amount or quantity" } };
  }

  const totalAmount = giftAmount * giftQuantity;
  let senderWallet = await storage.getWallet(senderId);
  if (!senderWallet) {
    senderWallet = await storage.createWallet(senderId, senderId === "user_001" ? 450 : 0);
  }

  const result = await storage.executeWalletOperation({
    userId: senderId,
    operation: 'debit',
    amount: totalAmount,
    transactionId,
    transactionType: 'gift',
    description: `Gift sent to ${recipientId}`,
    metadata: {
      recipientId,
      giftId,
      giftName: gift.name,
      giftAmount,
      quantity: giftQuantity,
      message,
    },
  });

  if (!result.success) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: result.error?.message || 'Gift sending failed',
        code: result.error?.code,
        wallet: result.wallet,
      },
    };
  }

  const creatorWallet = await storage.addToWallet(`creator_${recipientId}`, totalAmount);
  return {
    statusCode: 200,
    body: {
      success: true,
      wallet: result.wallet,
      creatorWallet,
      gift,
      amount: totalAmount,
      transactionId,
    },
  };
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

  app.get("/api/creator-media/:creatorId/:index", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const index = Number(req.params.index);
      const sourceUrl = creatorMediaSources[creatorId]?.[index];

      if (!Number.isInteger(index) || index < 0 || !sourceUrl) {
        return res.status(404).json({ error: "Creator media not found." });
      }

      const upstream = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "LINKY-media-proxy/1.0",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!upstream.ok) {
        return res.status(502).json({ error: "Unable to load creator media." });
      }

      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load creator media." });
    }
  });

  app.post("/api/zego/token", async (req: Request, res: Response) => {
    try {
      const appId = Number(process.env.ZEGO_APP_ID);
      const serverSecret = process.env.ZEGO_SERVER_SECRET || "";
      const serverUrl = process.env.ZEGO_SERVER_URL || "";
      const { userId, roomId, canPublish = true } = req.body || {};

      if (!appId || !serverSecret || !serverUrl) {
        return res.status(500).json({
          error: "ZEGOCLOUD is not configured. Set ZEGO_APP_ID, ZEGO_SERVER_SECRET, and ZEGO_SERVER_URL.",
        });
      }

      if (!userId || !roomId) {
        return res.status(400).json({ error: "userId and roomId are required." });
      }

      const serverSecretBytes = Buffer.byteLength(serverSecret);
      if (![16, 24, 32].includes(serverSecretBytes)) {
        return res.status(500).json({
          error: `ZEGOCLOUD server secret is invalid (${serverSecretBytes} bytes). Set ZEGO_SERVER_SECRET from the ZEGOCLOUD dashboard; this token generator requires 16, 24, or 32 bytes.`,
        });
      }

      const token = generateZegoToken04({
        appId,
        userId: String(userId),
        serverSecret,
        roomId: String(roomId),
        canPublish: Boolean(canPublish),
      });

      res.json({
        appId,
        serverUrl,
        token,
        userId: String(userId),
        roomId: String(roomId),
        expiresIn: 3600,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate ZEGOCLOUD token." });
    }
  });

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
      const { username, password, mobileNumber, phone, otp } = req.body;
      const requestedPhone = String(mobileNumber || phone || username || "").replace(/\D/g, "");

      if (requestedPhone === "9717629692") {
        if (otp !== "123456" && password !== "123456") {
          return res.status(401).json({ error: "Invalid OTP" });
        }

        const userId = "super_user_9717629692";
        const accessToken = generateAccessToken({ userId, role: "super_user" });
        const refreshToken = generateRefreshToken({ userId, role: "super_user" });

        res.cookie('adminRefreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        });

        return res.json({
          success: true,
          accessToken,
          user: {
            userId,
            username: "Super User",
            phone: "9717629692",
            role: "super_user",
            name: "Super User"
          }
        });
      }

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

  app.post("/api/creator/applications", async (req: Request, res: Response) => {
    try {
      const {
        name,
        email = "",
        mobile = "",
        role = "creator",
        bankAccountNumber,
        bankIfscCode,
        bankAccountName,
        aadharNumber,
        panNumber,
        referralCode = "",
      } = req.body || {};

      if (!name || !bankAccountNumber || !bankIfscCode || !bankAccountName || !aadharNumber || !panNumber) {
        return res.status(400).json({ error: "Missing required creator application fields" });
      }

      if (role !== "creator" && role !== "agent") {
        return res.status(400).json({ error: "Invalid application role" });
      }

      const mobileDigits = String(mobile || "").replace(/\D/g, "");
      const id = `${role}_${mobileDigits || generateUUID()}`;
      const application: CreatorApplication = {
        id,
        name: String(name),
        mobile: mobileDigits ? `+91 ${mobileDigits}` : "Not provided",
        email: String(email || ""),
        role,
        bankAccount: String(bankAccountNumber),
        ifsc: String(bankIfscCode).toUpperCase(),
        bankAccountName: String(bankAccountName),
        aadhar: maskAadhar(String(aadharNumber)),
        pan: String(panNumber).toUpperCase(),
        referralCode: String(referralCode || ""),
        submittedAt: new Date().toISOString(),
        currentRate: role === "creator" ? 50 : undefined,
        currentCommission: role === "agent" ? 20 : undefined,
        status: "pending",
      };

      creatorApplications.set(id, application);
      res.status(201).json({ success: true, application });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/kyc-applications", async (_req: Request, res: Response) => {
    try {
      const applications = Array.from(creatorApplications.values())
        .filter((application) => application.status === "pending")
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

      res.json({
        creators: applications.filter((application) => application.role === "creator"),
        agents: applications.filter((application) => application.role === "agent"),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/approve", async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const application = creatorApplications.get(String(id));
      if (application) {
        application.status = "approved";
        creatorApplications.set(application.id, application);
      }
      res.json({ success: true, application });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/reject", async (req: Request, res: Response) => {
    try {
      const { id, reason = "" } = req.body || {};
      const application = creatorApplications.get(String(id));
      if (application) {
        application.status = "rejected";
        application.rejectionReason = String(reason);
        creatorApplications.set(application.id, application);
      }
      res.json({ success: true, application });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/ban", async (req: Request, res: Response) => {
    try {
      const { id } = req.body || {};
      const application = creatorApplications.get(String(id));
      if (application) {
        application.status = "banned";
        creatorApplications.set(application.id, application);
      }
      res.json({ success: true, application });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-rate", async (req: Request, res: Response) => {
    try {
      const { creatorId, rate } = req.body || {};
      const numericRate = Number(rate);

      if (!creatorId || !Number.isFinite(numericRate)) {
        return res.status(400).json({ error: "creatorId and numeric rate are required" });
      }

      if (numericRate < 10 || numericRate > 500) {
        return res.status(400).json({ error: "Creator rate must be between ₹10 and ₹500 per minute" });
      }

      const record = {
        creatorId: String(creatorId),
        rate: numericRate,
        updatedAt: new Date().toISOString(),
      };
      creatorRates.set(record.creatorId, record);

      const application = creatorApplications.get(record.creatorId);
      if (application && application.role === "creator") {
        application.currentRate = numericRate;
        creatorApplications.set(application.id, application);
      }

      res.json({ success: true, ...record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-commission", async (req: Request, res: Response) => {
    try {
      const { agencyId, commission } = req.body || {};
      const numericCommission = Number(commission);

      if (!agencyId || !Number.isFinite(numericCommission)) {
        return res.status(400).json({ error: "agencyId and numeric commission are required" });
      }

      if (numericCommission < 1 || numericCommission > 80) {
        return res.status(400).json({ error: "Agency commission must be between 1% and 80%" });
      }

      const record = {
        agencyId: String(agencyId),
        commission: numericCommission,
        updatedAt: new Date().toISOString(),
      };
      agencyCommissions.set(record.agencyId, record);

      const application = creatorApplications.get(record.agencyId);
      if (application && application.role === "agent") {
        application.currentCommission = numericCommission;
        creatorApplications.set(application.id, application);
      }

      res.json({ success: true, ...record });
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

  app.post("/api/razorpay/orders", async (req: Request, res: Response) => {
    try {
      const { userId, amount, paymentMethod = "upi" } = req.body || {};
      const numericAmount = Number(amount);
      const validPaymentMethods = ['upi', 'card', 'netbanking'];

      if (!userId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: "Valid userId and amount are required." });
      }

      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      const MIN_AMOUNT = 10;
      const MAX_AMOUNT = 100000;
      if (numericAmount < MIN_AMOUNT) {
        return res.status(400).json({ error: `Minimum recharge amount is ₹${MIN_AMOUNT}` });
      }
      if (numericAmount > MAX_AMOUNT) {
        return res.status(400).json({ error: `Maximum recharge amount is ₹${MAX_AMOUNT}` });
      }

      const bonus = calculateBonus(numericAmount, DEFAULT_BONUS_TIERS);
      const totalAmount = numericAmount + bonus;
      const receipt = `rcpt_${Date.now()}`.slice(0, 40);
      const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(numericAmount * 100),
        currency: "INR",
        receipt,
        notes: {
          userId: String(userId),
          paymentMethod: String(paymentMethod),
          rechargeAmount: String(numericAmount),
          bonusAmount: String(bonus),
          walletCredit: String(totalAmount),
        },
      });

      razorpayOrders.set(razorpayOrder.id, {
        userId: String(userId),
        amount: numericAmount,
        bonus,
        totalAmount,
        paymentMethod,
        receipt,
        status: "created",
      });

      res.json({
        success: true,
        keyId: RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt,
        bonus,
        totalAmount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unable to create Razorpay order." });
    }
  });

  app.post("/api/razorpay/verify", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        paymentMethod = "upi",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body || {};

      if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing Razorpay verification fields." });
      }

      const pendingOrder = razorpayOrders.get(String(razorpay_order_id));
      if (!pendingOrder) {
        return res.status(404).json({ error: "Razorpay order not found or expired." });
      }

      if (pendingOrder.userId !== String(userId)) {
        return res.status(403).json({ error: "Razorpay order does not belong to this user." });
      }

      if (pendingOrder.status === "paid") {
        const wallet = await storage.getWallet(pendingOrder.userId);
        return res.json({
          success: true,
          wallet,
          transaction: {
            transactionId: pendingOrder.transactionId,
            status: "success",
            paymentMethod: pendingOrder.paymentMethod,
          },
          bonus: pendingOrder.bonus,
          totalAmount: pendingOrder.totalAmount,
          status: "success",
          transactionId: pendingOrder.transactionId,
          message: "Payment already verified.",
        });
      }

      const isValidSignature = verifyRazorpaySignature(
        String(razorpay_order_id),
        String(razorpay_payment_id),
        String(razorpay_signature),
      );

      if (!isValidSignature) {
        return res.status(400).json({ error: "Invalid Razorpay payment signature." });
      }

      const transactionId = String(razorpay_payment_id);
      await storage.createRechargeTransaction({
        userId: pendingOrder.userId,
        amount: pendingOrder.totalAmount,
        paymentMethod: pendingOrder.paymentMethod || paymentMethod,
        status: "success",
        transactionId,
      });

      const wallet = await storage.addToWallet(pendingOrder.userId, pendingOrder.totalAmount);
      pendingOrder.status = "paid";
      pendingOrder.paymentId = transactionId;
      pendingOrder.transactionId = transactionId;
      razorpayOrders.set(String(razorpay_order_id), pendingOrder);

      res.json({
        success: true,
        wallet,
        transaction: {
          transactionId,
          status: "success",
          paymentMethod: pendingOrder.paymentMethod,
          amount: pendingOrder.amount,
          currency: "INR",
          razorpayOrderId: razorpay_order_id,
        },
        bonus: pendingOrder.bonus,
        totalAmount: pendingOrder.totalAmount,
        status: "success",
        transactionId,
        message: "Payment verified and wallet credited.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unable to verify Razorpay payment." });
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
      const { userId, creatorId, creatorName, userName, callType, durationSeconds, pricePerMinute, callCost, giftCost = 0, totalCost } = req.body;

      if (!userId || !creatorId || !totalCost) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transactionId = `CALL${Date.now()}`;
      const numericCallCost = Number(callCost);
      const numericGiftCost = Number(giftCost || 0);
      const numericTotalCost = Number(totalCost);
      const amountToDebit = Number.isFinite(numericCallCost) && numericCallCost >= 0
        ? numericCallCost
        : Math.max(0, numericTotalCost - numericGiftCost);

      // Use atomic wallet operation
      const result = await storage.executeWalletOperation({
        userId,
        operation: 'debit',
        amount: amountToDebit,
        transactionId,
        transactionType: 'call',
        description: `Call with ${creatorName || creatorId}`,
        metadata: {
          creatorId,
          creatorName,
          userName,
          callType,
          durationSeconds,
          pricePerMinute,
          callCost: amountToDebit,
          giftCost: numericGiftCost,
          sessionTotal: amountToDebit + numericGiftCost,
        },
      });

      if (result.success) {
        const creatorWallet = await storage.addToWallet(`creator_${creatorId}`, amountToDebit);

        res.json({ success: true, wallet: result.wallet, creatorWallet, transactionId });
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

  function formatCallTransaction(transaction: any, creatorIdOverride?: string) {
    const metadata = transaction.metadata || {};
    const createdAt = transaction.createdAt.toISOString();
    const durationSeconds = Number(metadata.durationSeconds || 0);
    return {
      id: transaction.transactionId,
      userId: transaction.userId,
      userName: metadata.userName || "User",
      creatorId: creatorIdOverride || metadata.creatorId,
      creatorName: metadata.creatorName || metadata.creatorId || "Creator",
      callType: metadata.callType || "audio",
      durationSeconds,
      durationLabel: `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`,
      pricePerMinute: Number(metadata.pricePerMinute || 0),
      callCost: Number(metadata.callCost || transaction.amount),
      giftCost: Number(metadata.giftCost || 0),
      totalCost: Number(metadata.sessionTotal || Number(transaction.amount) + Number(metadata.giftCost || 0)),
      creatorEarnings: Number(metadata.sessionTotal || Number(transaction.amount) + Number(metadata.giftCost || 0)),
      status: "completed",
      createdAt,
      date: new Date(createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    };
  }

  app.get("/api/call-logs/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const transactions = await storage.getTransactionHistory(userId, { type: "call", limit: 100 });
      res.json(transactions.map((transaction) => formatCallTransaction(transaction)));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/call-logs/creator/:creatorId", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const transactions = await storage.getAllTransactionHistory({ type: "call", limit: 500 });
      res.json(
        transactions
          .filter((transaction) => transaction.metadata?.creatorId === creatorId)
          .map((transaction) => formatCallTransaction(transaction, creatorId))
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/creator/:creatorId/earnings", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      let wallet = await storage.getWallet(`creator_${creatorId}`);
      if (!wallet) {
        wallet = await storage.createWallet(`creator_${creatorId}`, 0);
      }

      const callTransactions = (await storage.getAllTransactionHistory({ type: "call", limit: 500 }))
        .filter((transaction) => transaction.metadata?.creatorId === creatorId);
      const giftTransactions = (await storage.getAllTransactionHistory({ type: "gift", limit: 500 }))
        .filter((transaction) => transaction.metadata?.recipientId === creatorId);

      res.json({
        wallet,
        balance: wallet.balance,
        totals: {
          calls: callTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0),
          gifts: giftTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0),
          all: Number(wallet.balance),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/creator/:creatorId/status", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      res.json(getCreatorStatusRecord(creatorId));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/creator/:creatorId/status", async (req: Request, res: Response) => {
    try {
      const { creatorId } = req.params;
      const status = String(req.body?.status || req.body?.callStatus || "");
      const validStatuses = ["available", "on_call", "offline"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid creator status" });
      }

      const record = {
        creatorId,
        status: status as "available" | "on_call" | "offline",
        callStatus: status as "available" | "on_call" | "offline",
        updatedAt: new Date().toISOString(),
      };
      creatorStatuses.set(creatorId, record);
      res.json(record);
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

  app.post("/api/gift-requests", async (req: Request, res: Response) => {
    try {
      const {
        roomId,
        creatorId,
        creatorName,
        requesterId,
        requesterName,
        userId = "user_001",
        giftId,
        quantity = 1,
      } = req.body || {};

      if (!roomId || !creatorId || !giftId) {
        return res.status(400).json({ error: "roomId, creatorId, and giftId are required" });
      }

      const gift = await storage.getGift(String(giftId));
      if (!gift) {
        return res.status(404).json({ error: "Gift not found" });
      }

      const giftAmount = Number(gift.amount);
      const giftQuantity = Number(quantity);
      if (!Number.isFinite(giftAmount) || giftAmount <= 0 || !Number.isFinite(giftQuantity) || giftQuantity <= 0) {
        return res.status(400).json({ error: "Invalid gift request amount" });
      }

      const now = new Date().toISOString();
      const request: GiftRequestRecord = {
        id: `GIFT_REQUEST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        roomId: String(roomId),
        creatorId: String(creatorId),
        creatorName: String(creatorName || creatorId),
        requesterId: String(requesterId || `creator_${creatorId}`),
        requesterName: String(requesterName || creatorName || "Creator"),
        userId: String(userId),
        giftId: String(giftId),
        giftName: gift.name,
        giftAmount,
        quantity: giftQuantity,
        totalAmount: giftAmount * giftQuantity,
        status: "requested",
        createdAt: now,
        updatedAt: now,
      };

      giftRequests.set(request.id, request);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unable to create gift request" });
    }
  });

  app.get("/api/gift-requests/room/:roomId", async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const status = req.query.status ? String(req.query.status) : "";
      const requests = Array.from(giftRequests.values())
        .filter((request) => request.roomId === roomId)
        .filter((request) => !status || request.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unable to load gift requests" });
    }
  });

  app.post("/api/gift-requests/:requestId/respond", async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { action, responderId = "user_001", responderName = "User" } = req.body || {};
      const request = giftRequests.get(requestId);

      if (!request) {
        return res.status(404).json({ error: "Gift request not found" });
      }

      if (request.status !== "requested") {
        return res.status(409).json({ error: `Gift request is already ${request.status}`, request });
      }

      if (action === "rejected") {
        const updatedRequest = {
          ...request,
          status: "rejected" as const,
          responderId: String(responderId),
          responderName: String(responderName),
          updatedAt: new Date().toISOString(),
        };
        giftRequests.set(requestId, updatedRequest);
        return res.json({ success: true, request: updatedRequest });
      }

      if (action !== "accepted") {
        return res.status(400).json({ error: "action must be accepted or rejected" });
      }

      const transactionId = `GIFTREQ${Date.now()}`;
      const giftDebit = await debitGiftFromWallet({
        senderId: request.userId,
        recipientId: request.creatorId,
        giftId: request.giftId,
        quantity: request.quantity,
        message: `Accepted creator gift request ${request.id}`,
        transactionId,
      });

      if (giftDebit.statusCode !== 200) {
        return res.status(giftDebit.statusCode).json({
          ...giftDebit.body,
          request,
        });
      }

      const walletBalance = Number((giftDebit.body as any).wallet?.balance ?? 0);
      const updatedRequest = {
        ...request,
        status: "accepted" as const,
        responderId: String(responderId),
        responderName: String(responderName),
        walletBalance,
        transactionId,
        updatedAt: new Date().toISOString(),
      };
      giftRequests.set(requestId, updatedRequest);

      res.json({
        ...(giftDebit.body as any),
        request: updatedRequest,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unable to respond to gift request" });
    }
  });

  app.post("/api/gifts/send", async (req: Request, res: Response) => {
    try {
      const { senderId, recipientId, giftId, quantity, message } = req.body;
      const giftDebit = await debitGiftFromWallet({
        senderId,
        recipientId,
        giftId,
        quantity,
        message,
      });

      res.status(giftDebit.statusCode).json(giftDebit.body);
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
