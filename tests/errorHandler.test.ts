/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { AppError, errors, errorHandler } from '../server/middleware/errorHandler'

function fakeRes(): Response & { _body?: unknown; _status?: number } {
    const r: any = {}
    r.status = vi.fn((code: number) => {
        r._status = code
        return r
    })
    r.json = vi.fn((body: unknown) => {
        r._body = body
        return r
    })
    return r as Response & { _body?: unknown; _status?: number }
}

const fakeReq = { method: 'GET', path: '/api/v1/foo' } as unknown as Request

describe('errors helpers', () => {
    it('badRequest -> 400 BAD_REQUEST', () => {
        const e = errors.badRequest('phone is required')
        expect(e).toBeInstanceOf(AppError)
        expect(e.status).toBe(400)
        expect(e.code).toBe('BAD_REQUEST')
    })

    it('forbidden -> 403 FORBIDDEN', () => {
        const e = errors.forbidden()
        expect(e.status).toBe(403)
        expect(e.code).toBe('FORBIDDEN')
    })
})

describe('errorHandler middleware', () => {
    it('serializes AppError with public message', () => {
        const res = fakeRes()
        errorHandler(errors.notFound('user not found'), fakeReq, res, () => undefined)
        expect(res._status).toBe(404)
        expect((res._body as any).error).toBe('user not found')
        expect((res._body as any).code).toBe('NOT_FOUND')
    })

    it('coerces plain Error to status 500', () => {
        const res = fakeRes()
        errorHandler(new Error('boom'), fakeReq, res, () => undefined)
        expect(res._status).toBe(500)
        expect((res._body as any).code).toBe('INTERNAL_ERROR')
    })

    it('hides stack in production', () => {
        const prev = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'
        try {
            const res = fakeRes()
            errorHandler(new Error('db: column "secret" does not exist'), fakeReq, res, () => undefined)
            expect((res._body as any).stack).toBeUndefined()
        } finally {
            process.env.NODE_ENV = prev
        }
    })
})
