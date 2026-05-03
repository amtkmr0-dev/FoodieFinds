/**
 * Request logger middleware
 *
 * Pulled out of `server/index.ts` so the dev and prod entry points share one
 * implementation (Manus review §3.4).
 */

import type { NextFunction, Request, Response } from 'express'
import { logger } from '../logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    const path = req.path
    let capturedJsonResponse: Record<string, unknown> | undefined

    const originalResJson = res.json.bind(res)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json = function (bodyJson: any, ...args: any[]) {
        capturedJsonResponse = bodyJson
        return originalResJson(bodyJson, ...args)
    }

    res.on('finish', () => {
        const duration = Date.now() - start
        if (!path.startsWith('/api')) return

        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`
        if (capturedJsonResponse) {
            // Avoid logging large or sensitive payloads in production.
            if (process.env.NODE_ENV !== 'production') {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`
            }
        }
        if (logLine.length > 160) {
            logLine = logLine.slice(0, 159) + '…'
        }

        logger.info(logLine)
    })

    next()
}
