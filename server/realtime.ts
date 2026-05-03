/**
 * Realtime gateway (WebSocket) — Manus review §4.1
 *
 * Replaces the timer-based polling that used to live in:
 *   - client/src/hooks/useWallet.tsx           (every 10s)
 *   - client/src/hooks/usePaymentPolling.ts    (every  3s)
 *   - client/src/hooks/useCallBalanceMonitor.ts (every 2s)
 *
 * Wire-protocol (deliberately simple, single message type each way):
 *
 *   c->s : { type: "auth",        token: "<jwt>" }
 *   c->s : { type: "subscribe",   channel: "wallet:user_001" }
 *   c->s : { type: "unsubscribe", channel: "wallet:user_001" }
 *   c->s : { type: "ping" }
 *
 *   s->c : { type: "ready" }
 *   s->c : { type: "auth_error", error: "..." }
 *   s->c : { type: "event", channel, event: { ... } }
 *   s->c : { type: "pong" }
 *
 * Channels currently published by app code:
 *   - wallet:{userId}        — fired on every successful wallet mutation
 *   - payment:{transactionId} — fired by the payment processor's webhook
 *
 * A user can only subscribe to channels keyed by their own userId. Anyone
 * with a transactionId can subscribe to that payment's events (the id is a
 * sufficient capability).
 */

import type { Server as HttpServer } from 'http'
import { WebSocketServer, type WebSocket } from 'ws'
import { logger } from './logger'
import { verifyToken, type JWTPayload } from './auth'

interface AuthedSocket {
    socket: WebSocket
    userId: string | null  // null until auth succeeds
    role: JWTPayload['role'] | null
    channels: Set<string>
    isAlive: boolean
}

let realtime: RealtimeGateway | null = null

class RealtimeGateway {
    private wss: WebSocketServer
    private clients = new Set<AuthedSocket>()
    private heartbeat: ReturnType<typeof setInterval>

    constructor(httpServer: HttpServer) {
        // path=/ws keeps Vite's HMR endpoint and any other WS users out of
        // our way, and makes proxy / nginx config straightforward.
        this.wss = new WebSocketServer({ server: httpServer, path: '/ws' })

        this.wss.on('connection', (socket) => this.onConnection(socket))

        // Drop dead connections after two missed heartbeats.
        this.heartbeat = setInterval(() => {
            for (const c of this.clients) {
                if (!c.isAlive) {
                    try { c.socket.terminate() } catch { /* ignore */ }
                    this.clients.delete(c)
                    continue
                }
                c.isAlive = false
                try { c.socket.ping() } catch { /* ignore */ }
            }
        }, 30_000)

        logger.info('realtime: WebSocket gateway attached at /ws')
    }

    private onConnection(socket: WebSocket): void {
        const client: AuthedSocket = {
            socket,
            userId: null,
            role: null,
            channels: new Set(),
            isAlive: true,
        }
        this.clients.add(client)

        socket.on('pong', () => { client.isAlive = true })

        socket.on('message', (raw) => {
            let msg: any
            try {
                msg = JSON.parse(raw.toString())
            } catch {
                return // ignore malformed
            }

            switch (msg?.type) {
                case 'auth':
                    this.handleAuth(client, msg.token)
                    break
                case 'subscribe':
                    this.handleSubscribe(client, msg.channel)
                    break
                case 'unsubscribe':
                    if (typeof msg.channel === 'string') client.channels.delete(msg.channel)
                    break
                case 'ping':
                    safeSend(client, { type: 'pong' })
                    break
                default:
                    // Ignore unknown message types so we can extend later
                    // without breaking older clients.
            }
        })

        socket.on('close', () => { this.clients.delete(client) })
        socket.on('error', () => { this.clients.delete(client) })

        // Tell the client the channel is open. Some clients use this as a
        // signal to start sending `auth` / `subscribe`.
        safeSend(client, { type: 'ready' })
    }

    private handleAuth(client: AuthedSocket, token: unknown): void {
        if (typeof token !== 'string') {
            safeSend(client, { type: 'auth_error', error: 'token required' })
            return
        }
        const payload = verifyToken(token)
        if (!payload) {
            safeSend(client, { type: 'auth_error', error: 'invalid token' })
            return
        }
        client.userId = payload.userId
        client.role = payload.role
        safeSend(client, { type: 'auth_ok', userId: payload.userId, role: payload.role })
    }

    private handleSubscribe(client: AuthedSocket, channel: unknown): void {
        if (typeof channel !== 'string' || channel.length === 0 || channel.length > 200) {
            return
        }

        // Authorization rules.
        if (channel.startsWith('wallet:')) {
            const userId = channel.slice('wallet:'.length)
            if (client.userId !== userId && client.role !== 'admin' && client.role !== 'super_user') {
                // Silently drop unauthorized subscribe to avoid leaking
                // who has wallets.
                return
            }
        } else if (channel.startsWith('call:')) {
            const userId = channel.slice('call:'.length)
            if (client.userId !== userId && client.role !== 'admin' && client.role !== 'super_user') {
                return
            }
        } else if (channel.startsWith('payment:')) {
            // Payment channels are keyed by transactionId; possessing the id
            // is the auth capability. Still require *some* auth to prevent
            // anonymous fanout floods.
            if (!client.userId) return
        } else {
            // Reject unknown channel types - nothing to leak yet.
            return
        }

        client.channels.add(channel)
    }

    /** Publish an event to every authorised subscriber of `channel`. */
    publish(channel: string, event: Record<string, unknown>): void {
        const payload = JSON.stringify({ type: 'event', channel, event })
        for (const c of this.clients) {
            if (c.channels.has(channel)) {
                try { c.socket.send(payload) } catch { /* ignore broken sockets */ }
            }
        }
    }

    close(): void {
        clearInterval(this.heartbeat)
        for (const c of this.clients) {
            try { c.socket.terminate() } catch { /* ignore */ }
        }
        this.clients.clear()
        this.wss.close()
    }
}

function safeSend(client: AuthedSocket, payload: Record<string, unknown>): void {
    try { client.socket.send(JSON.stringify(payload)) } catch { /* ignore */ }
}

/** Attach the realtime gateway to an HTTP server. Idempotent. */
export function attachRealtime(httpServer: HttpServer): RealtimeGateway {
    if (!realtime) realtime = new RealtimeGateway(httpServer)
    return realtime
}

/**
 * Publish an event to everyone subscribed to `channel`. No-op if the
 * gateway hasn't been attached (e.g. inside a unit test where we don't
 * spin up a real HTTP server).
 */
export function publishRealtime(channel: string, event: Record<string, unknown>): void {
    realtime?.publish(channel, event)
}

/** Test helper: tear down the gateway between specs. */
export function __resetRealtimeForTests(): void {
    realtime?.close()
    realtime = null
}
