import express from 'express'
import { registerRoutes } from './routes'
import { serveStatic } from './vite'
import { logger } from './logger'
import { applySecurityMiddleware } from './middleware/security'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { attachRealtime } from './realtime'

const app = express()

// IMPORTANT: production was previously missing helmet/CORS/rate limiting that
// dev had configured. We now share one middleware stack (Manus review §3.4).
applySecurityMiddleware(app)
app.use(requestLogger)

;(async () => {
    const server = await registerRoutes(app)

    // Realtime gateway (Manus §4.1).
    attachRealtime(server)

    app.use(errorHandler)

    // In production we only serve prebuilt static assets - no Vite middleware.
    serveStatic(app)

    const port = parseInt(process.env.PORT || '5000', 10)
    server.listen(port, () => {
        logger.info(`serving on port ${port}`, { env: 'production' })
    })
})()
