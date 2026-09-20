/**
 * Unified security middleware
 *
 * Added in response to Manus review §3.4 "Inconsistent Security Middleware
 * Application". Previously `server/index.ts` configured Helmet + CORS + rate
 * limiting + cookie parsing, but `server/index.prod.ts` did NOT. That meant
 * production served the API with weaker defaults than development - the
 * exact opposite of what we want.
 *
 * Both entry points now call `applySecurityMiddleware(app)` so the policy is
 * defined in one place.
 */

import type { Express } from 'express'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import { logger } from '../logger'

function getAllowedOrigins(): string[] | true {
    if (process.env.NODE_ENV === 'production') {
        const fromEnv = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean)
        if (fromEnv && fromEnv.length > 0) return fromEnv
        // Fail loud-but-safe: no wildcard in production.
        logger.warn('ALLOWED_ORIGINS not set; defaulting to https://foodiefinds.com')
        return ['https://foodiefinds.com']
    }

    return [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
    ]
}

export function applySecurityMiddleware(app: Express): void {
    // 1. HTTP security headers.
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }),
    )

    // 2. CORS - origins resolved from env in production.
    app.use(
        cors({
            origin: getAllowedOrigins(),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }),
    )

    // 3. Rate limiting. Auth endpoints get a tighter cap than the rest.
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: 'Too many requests from this IP, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
    })

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { error: 'Too many authentication attempts, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
    })

    app.use('/api/', apiLimiter)
    app.use('/api/auth/', authLimiter)
    // Mirror the same limits on the versioned namespace.
    app.use('/api/v1/', apiLimiter)
    app.use('/api/v1/auth/', authLimiter)

    // 4. Body / cookie parsing.
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: false, limit: '10mb' }))
    app.use(cookieParser())
}
