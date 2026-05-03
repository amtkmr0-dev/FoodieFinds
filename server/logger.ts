/**
 * Structured logger
 *
 * Added in response to Manus review §1.2 "Error Handling and Logging".
 *
 * The previous implementation was a single `log(message, source)` helper that
 * always emitted via `console.log`. That made it hard to (a) silence noisy
 * output in tests, (b) collect production-grade JSON logs, and (c) reason
 * about severity. This module keeps the original `log()` function as a
 * back-compat shim while exposing a typed `logger` with levels.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
}

function currentLevel(): LogLevel {
    const raw = (process.env.LOG_LEVEL || 'info').toLowerCase()
    return (raw in LEVEL_PRIORITY ? raw : 'info') as LogLevel
}

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel()]
}

function timestamp(): string {
    return new Date().toISOString()
}

function emit(level: LogLevel, source: string, message: string, meta?: Record<string, unknown>) {
    if (!shouldLog(level)) return

    // In production we emit a single JSON line per log so downstream tools
    // (e.g. CloudWatch, Datadog) can parse it. In dev we keep the old
    // human-friendly format.
    if (process.env.NODE_ENV === 'production') {
        const payload = {
            ts: timestamp(),
            level,
            source,
            message,
            ...(meta ?? {}),
        }
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(payload))
        return
    }

    const formattedTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    })

    const tail = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
    // eslint-disable-next-line no-console
    console.log(`${formattedTime} [${source}] ${level.toUpperCase()} ${message}${tail}`)
}

export const logger = {
    error: (message: string, meta?: Record<string, unknown>, source = 'express') =>
        emit('error', source, message, meta),
    warn: (message: string, meta?: Record<string, unknown>, source = 'express') =>
        emit('warn', source, message, meta),
    info: (message: string, meta?: Record<string, unknown>, source = 'express') =>
        emit('info', source, message, meta),
    debug: (message: string, meta?: Record<string, unknown>, source = 'express') =>
        emit('debug', source, message, meta),
}

/**
 * Backwards-compatible helper kept for existing callers in `server/index.ts`,
 * `server/routes.ts`, etc. New code should prefer `logger.info(...)` etc.
 */
export function log(message: string, source = 'express') {
    logger.info(message, undefined, source)
}
