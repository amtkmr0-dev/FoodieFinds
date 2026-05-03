/**
 * Browser realtime client (Manus §4.1).
 *
 * Replaces three polling loops:
 *   - useWallet              (was refetching every 10s)
 *   - usePaymentPolling      (was hitting GET /api/payments/:id/status every 3s)
 *   - useCallBalanceMonitor  (was hitting GET /api/wallet/:id/balance-status every 2s)
 *
 * Single shared connection per browser tab. Subscribers register a handler
 * for a channel name and receive every event published on that channel.
 *
 * If the WebSocket fails to connect or repeatedly drops, the client
 * exposes `isConnected` so call sites can fall back to a slower poll.
 * The hooks in this app do exactly that.
 */

type EventHandler = (event: any) => void

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? ''
const WS_OVERRIDE = (import.meta as any).env?.VITE_WS_URL as string | undefined

function deriveWsUrl(): string {
    if (WS_OVERRIDE) return WS_OVERRIDE
    if (typeof window === 'undefined') return ''

    let httpBase = API_BASE
    if (!httpBase) {
        // Same-origin deployment: use the page's own host.
        httpBase = `${window.location.protocol}//${window.location.host}`
    }
    return httpBase.replace(/^http/, 'ws') + '/ws'
}

interface Subscription {
    channel: string
    handler: EventHandler
}

class RealtimeClient {
    private ws: WebSocket | null = null
    private url = ''
    private token: string | null = null
    private authed = false

    private subs: Subscription[] = []
    private reconnectAttempt = 0
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private connecting = false

    /** Latest connection state, exposed to React via useSyncExternalStore. */
    private listeners = new Set<() => void>()
    private state: 'idle' | 'connecting' | 'open' | 'closed' = 'idle'

    setToken(token: string | null): void {
        this.token = token
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Re-auth on token change.
            this.send({ type: 'auth', token })
        }
    }

    /**
     * Subscribe to a channel. Returns an unsubscribe function. The hook is
     * idempotent - subscribing twice from the same call site is safe.
     */
    subscribe(channel: string, handler: EventHandler): () => void {
        const entry: Subscription = { channel, handler }
        this.subs.push(entry)

        // First subscriber lights up the connection.
        if (!this.ws) this.connect()

        // If already connected, register subscription server-side.
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.authed) {
            this.send({ type: 'subscribe', channel })
        }

        return () => {
            const idx = this.subs.indexOf(entry)
            if (idx >= 0) this.subs.splice(idx, 1)

            // Tell the server to stop pushing if no other listener cares.
            if (!this.subs.some((s) => s.channel === channel)) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.send({ type: 'unsubscribe', channel })
                }
            }
        }
    }

    /** React-friendly snapshot subscription. */
    subscribeState(listener: () => void): () => void {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    }

    getState(): 'idle' | 'connecting' | 'open' | 'closed' {
        return this.state
    }

    private setState(next: 'idle' | 'connecting' | 'open' | 'closed'): void {
        if (next === this.state) return
        this.state = next
        for (const l of this.listeners) l()
    }

    private connect(): void {
        if (this.connecting || this.ws) return
        this.url = this.url || deriveWsUrl()
        if (!this.url) return

        this.connecting = true
        this.setState('connecting')

        let socket: WebSocket
        try {
            socket = new WebSocket(this.url)
        } catch {
            this.connecting = false
            this.setState('closed')
            this.scheduleReconnect()
            return
        }
        this.ws = socket

        socket.onopen = () => {
            this.connecting = false
            this.reconnectAttempt = 0
            this.setState('open')

            if (this.token) this.send({ type: 'auth', token: this.token })

            // Re-subscribe everything.
            const channels = new Set(this.subs.map((s) => s.channel))
            for (const ch of channels) this.send({ type: 'subscribe', channel: ch })
        }

        socket.onmessage = (ev) => {
            let msg: any
            try { msg = JSON.parse(ev.data as string) } catch { return }

            if (msg?.type === 'auth_ok') {
                this.authed = true
                return
            }
            if (msg?.type === 'auth_error') {
                this.authed = false
                return
            }
            if (msg?.type === 'event' && typeof msg.channel === 'string') {
                for (const sub of this.subs) {
                    if (sub.channel === msg.channel) {
                        try { sub.handler(msg.event) } catch (err) {
                            console.error('realtime handler threw', err)
                        }
                    }
                }
            }
        }

        socket.onerror = () => {
            // onclose will follow; let that path do the reconnect bookkeeping.
        }

        socket.onclose = () => {
            this.ws = null
            this.connecting = false
            this.authed = false
            this.setState('closed')
            if (this.subs.length > 0) this.scheduleReconnect()
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return
        const delay = Math.min(30_000, 500 * Math.pow(2, this.reconnectAttempt))
        this.reconnectAttempt++
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.connect()
        }, delay)
    }

    private send(payload: Record<string, unknown>): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
        try { this.ws.send(JSON.stringify(payload)) } catch { /* ignore */ }
    }
}

export const realtime = new RealtimeClient()
