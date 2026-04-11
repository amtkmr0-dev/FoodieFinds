import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // Access token expiration
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token expiration

// Token blacklist for logout functionality
const tokenBlacklist = new Set<string>();

// Rate limiting for authentication endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // Max 5 requests per window

export interface JWTPayload {
    userId: string;
    role: 'user' | 'admin' | 'super_user' | 'support' | 'creator';
    deviceId?: string;
    iat?: number;
    exp?: number;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return null;
        }
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Invalidate token (add to blacklist)
 */
export function invalidateToken(token: string): void {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (decoded && decoded.exp) {
            const timeUntilExpiry = decoded.exp * 1000 - Date.now();
            if (timeUntilExpiry > 0) {
                tokenBlacklist.add(token);
                // Remove from blacklist after token expires
                setTimeout(() => {
                    tokenBlacklist.delete(token);
                }, timeUntilExpiry);
            }
        }
    } catch (error) {
        console.error('Error invalidating token:', error);
    }
}

/**
 * Middleware to authenticate requests
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    const payload = verifyToken(token);
    if (!payload) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }

    // Attach user info to request
    (req as any).user = payload;
    next();
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        // Create new record or reset expired one
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW
        });
        next();
        return;
    }

    if (record.count >= MAX_REQUESTS) {
        const resetTime = Math.ceil((record.resetTime - now) / 1000);
        res.status(429).json({
            error: 'Too many requests. Please try again later.',
            retryAfter: resetTime
        });
        return;
    }

    record.count++;
    next();
}

/**
 * Clean up expired rate limit records
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW);

/**
 * Generate browser-compatible UUID with fallback
 */
export function generateUUID(): string {
    // Try crypto.randomUUID first (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fall back to custom implementation
        }
    }

    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Session timeout configuration
 */
export const SESSION_TIMEOUT = {
    WARNING: 5 * 60 * 1000, // 5 minutes before expiry
    EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Check if session is about to expire
 */
export function isSessionExpiringSoon(token: string): boolean {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (!decoded || !decoded.exp) return false;

        const timeUntilExpiry = decoded.exp * 1000 - Date.now();
        return timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_TIMEOUT.WARNING;
    } catch (error) {
        return false;
    }
}

/**
 * Get remaining session time in milliseconds
 */
export function getSessionRemainingTime(token: string): number {
    try {
        const decoded = jwt.decode(token) as { exp?: number };
        if (!decoded || !decoded.exp) return 0;

        const timeUntilExpiry = decoded.exp * 1000 - Date.now();
        return Math.max(0, timeUntilExpiry);
    } catch (error) {
        return 0;
    }
}
