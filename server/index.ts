import express from 'express'
import { registerRoutes } from './routes'
import { serveStatic } from './vite'
import { logger } from './logger'
import { applySecurityMiddleware } from './middleware/security'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { attachRealtime } from './realtime'

const app = express()

// Unified security stack (helmet, CORS, rate limit, body/cookie parsing).
// Applied identically to dev and prod via `server/index.prod.ts` per
// Manus review §3.4.
applySecurityMiddleware(app)

// Structured request logging.
app.use(requestLogger)

;(async () => {
    const server = await registerRoutes(app)

    // Realtime (WebSocket) gateway shares the HTTP server (Manus §4.1).
    // Mounted at /ws so it doesn't conflict with Vite HMR.
    attachRealtime(server)

    // Centralized error handler - register AFTER routes.
    app.use(errorHandler)

    // Vite dev middleware only in development.
    if (app.get('env') === 'development') {
        const { setupVite } = await import('./vite-dev')
        await setupVite(app, server)
    } else {
        serveStatic(app)
    }

    const port = parseInt(process.env.PORT || '5000', 10)
    server.listen(port, () => {
        logger.info(`serving on port ${port}`, { env: process.env.NODE_ENV ?? 'development' })
    })
})()
