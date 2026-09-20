/**
 * @vitest-environment node
 *
 * Realtime gateway smoke tests (Manus §4.1).
 *
 * The gateway is wrapped around `ws.WebSocketServer`. We spin up a real
 * HTTP server on an ephemeral port, attach the gateway, connect a couple
 * of clients, and verify the pub/sub semantics:
 *
 *   - Subscribers to `wallet:user_alice` receive Alice's events.
 *   - Subscribers to `wallet:user_bob` do NOT receive Alice's events.
 *   - An unauthenticated client cannot subscribe to a wallet channel.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'
import { AddressInfo } from 'node:net'
import WebSocket from 'ws'
import {
    attachRealtime,
    publishRealtime,
    __resetRealtimeForTests,
} from '../server/realtime'
import { generateAccessToken } from '../server/auth'

let server: http.Server
let wsBase = ''

function newClient(): WebSocket {
    return new WebSocket(`${wsBase}/ws`)
}

function nextMessage(ws: WebSocket): Promise<any> {
    return new Promise((resolve, reject) => {
        const onMessage = (data: WebSocket.Data) => {
            ws.off('message', onMessage)
            ws.off('error', onError)
            try { resolve(JSON.parse(data.toString())) } catch (e) { reject(e) }
        }
        const onError = (err: Error) => {
            ws.off('message', onMessage)
            reject(err)
        }
        ws.on('message', onMessage)
        ws.on('error', onError)
    })
}

function send(ws: WebSocket, payload: Record<string, unknown>): void {
    ws.send(JSON.stringify(payload))
}

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod'
    server = http.createServer()
    attachRealtime(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const addr = server.address() as AddressInfo
    wsBase = `ws://127.0.0.1:${addr.port}`
})

afterAll(async () => {
    __resetRealtimeForTests()
    await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('realtime: pub/sub', () => {
    it('routes events to the right subscriber by channel', async () => {
        const aliceToken = generateAccessToken({ userId: 'user_alice', role: 'user' })
        const bobToken = generateAccessToken({ userId: 'user_bob', role: 'user' })

        const alice = newClient()
        const bob = newClient()
        await Promise.all([
            new Promise((r) => alice.once('open', () => r(null))),
            new Promise((r) => bob.once('open', () => r(null))),
        ])
        // Drain the server's `ready` greeting.
        await Promise.all([nextMessage(alice), nextMessage(bob)])

        send(alice, { type: 'auth', token: aliceToken })
        send(bob, { type: 'auth', token: bobToken })
        await Promise.all([nextMessage(alice), nextMessage(bob)]) // auth_ok

        send(alice, { type: 'subscribe', channel: 'wallet:user_alice' })
        send(bob, { type: 'subscribe', channel: 'wallet:user_bob' })

        // Tiny pause to let server-side subscribe complete.
        await new Promise((r) => setTimeout(r, 50))

        // Set up "next event" promises BEFORE publishing.
        const aliceEvent = nextMessage(alice)
        let bobReceived = false
        bob.on('message', () => { bobReceived = true })

        publishRealtime('wallet:user_alice', {
            type: 'wallet:updated',
            wallet: { balance: 1234 },
        })

        const got = await aliceEvent
        expect(got.type).toBe('event')
        expect(got.channel).toBe('wallet:user_alice')
        expect(got.event.type).toBe('wallet:updated')
        expect(got.event.wallet.balance).toBe(1234)

        // Give bob a beat to (not) receive anything.
        await new Promise((r) => setTimeout(r, 50))
        expect(bobReceived).toBe(false)

        alice.close()
        bob.close()
    })

    it('rejects unauthorized wallet subscribes silently', async () => {
        const eve = newClient()
        await new Promise((r) => eve.once('open', () => r(null)))
        await nextMessage(eve) // ready

        // No auth - subscribe to someone else's wallet.
        send(eve, { type: 'subscribe', channel: 'wallet:user_alice' })
        await new Promise((r) => setTimeout(r, 50))

        let got = false
        eve.on('message', () => { got = true })
        publishRealtime('wallet:user_alice', {
            type: 'wallet:updated',
            wallet: { balance: 999 },
        })
        await new Promise((r) => setTimeout(r, 50))
        expect(got).toBe(false)

        eve.close()
    })

    it('admins can subscribe to any wallet channel', async () => {
        const adminToken = generateAccessToken({ userId: 'admin_root', role: 'admin' })
        const admin = newClient()
        await new Promise((r) => admin.once('open', () => r(null)))
        await nextMessage(admin) // ready
        send(admin, { type: 'auth', token: adminToken })
        await nextMessage(admin) // auth_ok

        send(admin, { type: 'subscribe', channel: 'wallet:user_someone_else' })
        await new Promise((r) => setTimeout(r, 50))

        const got = nextMessage(admin)
        publishRealtime('wallet:user_someone_else', {
            type: 'wallet:updated',
            wallet: { balance: 50 },
        })
        const event = await got
        expect(event.event.wallet.balance).toBe(50)

        admin.close()
    })
})
