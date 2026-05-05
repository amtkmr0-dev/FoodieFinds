/**
 * Authentication routes.
 *
 * Mounted at `/api/auth` from `server/routes/index.ts`. The previous
 * monolithic `server/routes.ts` had ~250 lines of auth code mixed in with
 * billing and gifts; this file owns the OTP / refresh / admin-login
 * lifecycle and nothing else.
 */

import { Router, type Request, type Response } from "express";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    invalidateToken,
    authenticateToken,
    requireRole,
    authRateLimit,
    generateUUID,
} from "../auth";
import { generateUsername } from "./_shared";
import { asyncHandler, errors } from "../middleware/errorHandler";

export function buildAuthRouter(): Router {
    const router = Router();

    // -------- User signup/login (phone + OTP) --------

    router.post("/send-otp", authRateLimit, asyncHandler(async (req: Request, res: Response) => {
        const { phone } = req.body;
        if (!phone || phone.length < 10) {
            throw errors.badRequest("Invalid phone number");
        }

        // In production, this would send an actual OTP via SMS.
        // For now, we generate a mock OTP and store it in memory.
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        (global as any).otpStore = (global as any).otpStore || new Map();
        (global as any).otpStore.set(phone, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            attempts: 0,
        });

        console.log(`OTP for ${phone}: ${otp}`); // Remove in production

        res.json({
            success: true,
            message: "OTP sent successfully",
            ...(process.env.NODE_ENV !== 'production' && { otp }),
        });
    }));

    router.post("/verify-otp", authRateLimit, asyncHandler(async (req: Request, res: Response) => {
        const { phone, otp, deviceId } = req.body;
        if (!phone || !otp) {
            throw errors.badRequest("Phone and OTP are required");
        }

        (global as any).otpStore = (global as any).otpStore || new Map();
        const storedOtpData = (global as any).otpStore.get(phone);

        if (!storedOtpData) {
            throw errors.badRequest("OTP expired or not found");
        }
        if (storedOtpData.expiresAt < Date.now()) {
            (global as any).otpStore.delete(phone);
            throw errors.badRequest("OTP expired");
        }
        if (storedOtpData.otp !== otp) {
            storedOtpData.attempts++;
            if (storedOtpData.attempts >= 3) {
                (global as any).otpStore.delete(phone);
                throw errors.badRequest("Too many failed attempts. Please request a new OTP.");
            }
            throw errors.badRequest("Invalid OTP");
        }

        const userId = deviceId || generateUUID();
        const username = generateUsername(phone);

        (global as any).userStore = (global as any).userStore || new Map();
        (global as any).userStore.set(userId, {
            phone,
            username,
            deviceId: userId,
            role: 'user',
            createdAt: new Date().toISOString(),
        });

        const accessToken = generateAccessToken({ userId, role: 'user', deviceId: userId });
        const refreshToken = generateRefreshToken({ userId, role: 'user', deviceId: userId });

        (global as any).otpStore.delete(phone);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        res.json({
            success: true,
            accessToken,
            user: { userId, username, phone, role: 'user' },
        });
    }));

    // -------- Token lifecycle --------

    router.post("/refresh", asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw errors.unauthorized("Refresh token not found");
        }

        const payload = verifyToken(refreshToken);
        if (!payload) {
            res.clearCookie('refreshToken');
            throw errors.unauthorized("Invalid refresh token");
        }

        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            role: payload.role,
            deviceId: payload.deviceId,
        });

        res.json({ accessToken: newAccessToken });
    }));

    router.post("/logout", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) invalidateToken(token);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        res.json({ success: true, message: "Logged out successfully" });
    }));

    // -------- Admin login/logout --------

    router.post("/admin/login", authRateLimit, asyncHandler(async (req: Request, res: Response) => {
        const { username, password } = req.body;
        if (!username || !password) {
            throw errors.badRequest("Username and password are required");
        }

        // In production this should query the DB. The current monolith
        // uses a hardcoded map; preserved verbatim so this refactor
        // doesn't change behavior.
        const adminCredentials: Record<string, { password: string; role: 'admin' | 'super_user' | 'support'; name: string }> = {
            'admin': { password: 'admin123', role: 'admin', name: 'Admin User' },
            'super': { password: 'super123', role: 'super_user', name: 'Super Admin' },
            'support': { password: 'support123', role: 'support', name: 'Support Agent' },
        };

        const admin = adminCredentials[username];
        if (!admin || admin.password !== password) {
            throw errors.unauthorized("Invalid credentials");
        }

        const userId = `admin_${username}`;
        const accessToken = generateAccessToken({ userId, role: admin.role });
        const refreshToken = generateRefreshToken({ userId, role: admin.role });

        res.cookie('adminRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.json({
            success: true,
            accessToken,
            user: { userId, username, role: admin.role, name: admin.name },
        });
    }));

    router.post(
        "/admin/logout",
        authenticateToken,
        requireRole('admin', 'super_user', 'support'),
        asyncHandler(async (req: Request, res: Response) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token) invalidateToken(token);

            res.clearCookie('adminRefreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            });

            res.json({ success: true, message: "Logged out successfully" });
        }),
    );

    router.get("/verify", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        res.json({
            valid: true,
            user: {
                userId: user.userId,
                role: user.role,
                deviceId: user.deviceId,
            },
        });
    }));

    return router;
}
