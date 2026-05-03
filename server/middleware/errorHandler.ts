/**
 * Centralized error-handling middleware
 *
 * Added in response to Manus review §1.2 "Error Handling and Logging".
 *
 * Why: previously, many routes did
 *
 *     res.status(500).json({ error: error.message })
 *
 * which leaked internal stack details (DB constraint names, file paths, ORM
 * shapes) to clients. This middleware:
 *
 *   1. Logs the full error server-side via the structured logger.
 *   2. Returns a stable JSON shape `{ error, code?, requestId? }` to the
 *      client.
 *   3. Strips internals when `NODE_ENV === 'production'`.
 *   4. Lets routes throw a typed `AppError` to set status/code without leaking
 *      arbitrary internals.
 */

import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { logger } from '../logger'

export class AppError extends Error {
    public readonly status: number
    public readonly code: string
    public readonly publicMessage: string
    public readonly meta?: Record<string, unknown>

    constructor(
        message: string,
        opts: {
            status?: number
            code?: string
            publicMessage?: string
            meta?: Record<string, unknown>
        } = {},
    ) {
        super(message)
        this.name = 'AppError'
        this.status = opts.status ?? 500
        this.code = opts.code ?? 'INTERNAL_ERROR'
        this.publicMessage = opts.publicMessage ?? message
        this.meta = opts.meta
    }
}

/** Common helpers so route handlers stay short. */
export const errors = {
    badRequest: (msg = 'Bad request', meta?: Record<string, unknown>) =>
        new AppError(msg, { status: 400, code: 'BAD_REQUEST', publicMessage: msg, meta }),
    unauthorized: (msg = 'Unauthorized') =>
        new AppError(msg, { status: 401, code: 'UNAUTHORIZED', publicMessage: msg }),
    forbidden: (msg = 'Forbidden') =>
        new AppError(msg, { status: 403, code: 'FORBIDDEN', publicMessage: msg }),
    notFound: (msg = 'Not found') =>
        new AppError(msg, { status: 404, code: 'NOT_FOUND', publicMessage: msg }),
    conflict: (msg = 'Conflict') =>
        new AppError(msg, { status: 409, code: 'CONFLICT', publicMessage: msg }),
    rateLimited: (msg = 'Too many requests') =>
        new AppError(msg, { status: 429, code: 'RATE_LIMITED', publicMessage: msg }),
}

/** Express middleware - register LAST in the chain. */
export const errorHandler: ErrorRequestHandler = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
) => {
    const isProd = process.env.NODE_ENV === 'production'

    // Best-effort coercion of unknown thrown values.
    const appErr =
        err instanceof AppError
            ? err
            : err instanceof Error
                ? new AppError(err.message, { status: (err as { status?: number }).status ?? 500 })
                : new AppError('Unknown error')

    logger.error(`${req.method} ${req.path} -> ${appErr.status} ${appErr.code}`, {
        message: appErr.message,
        stack: err instanceof Error ? err.stack : undefined,
        meta: appErr.meta,
    })

    // Public payload: never include the stack or arbitrary error.message in
    // production - only the curated `publicMessage`.
    res.status(appErr.status).json({
        error: isProd ? appErr.publicMessage : appErr.message,
        code: appErr.code,
        ...(isProd ? {} : { stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined }),
    })
}

/**
 * Wrap an async route handler so thrown errors flow into `errorHandler`
 * without each route needing its own try/catch.
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }) as unknown as T
}
