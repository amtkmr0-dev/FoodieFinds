/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
    generateAccessToken,
    verifyToken,
    invalidateToken,
    permissionsForRole,
    PERMISSIONS,
} from '../server/auth'

beforeAll(() => {
    // Pinned secret so tokens are deterministic in CI.
    process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod'
})

describe('auth: JWT lifecycle', () => {
    it('round-trips a payload through generate / verify', () => {
        const token = generateAccessToken({ userId: 'u_123', role: 'user' })
        const decoded = verifyToken(token)
        expect(decoded?.userId).toBe('u_123')
        expect(decoded?.role).toBe('user')
    })

    it('rejects tampered tokens', () => {
        const token = generateAccessToken({ userId: 'u_123', role: 'user' })
        const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a')
        expect(verifyToken(tampered)).toBeNull()
    })

    it('rejects blacklisted tokens', () => {
        const token = generateAccessToken({ userId: 'u_123', role: 'user' })
        invalidateToken(token)
        expect(verifyToken(token)).toBeNull()
    })
})

describe('auth: granular RBAC (Manus §3.3)', () => {
    it('users only get wallet:read', () => {
        const perms = permissionsForRole('user')
        expect(perms).toContain(PERMISSIONS.WALLET_READ)
        expect(perms).not.toContain(PERMISSIONS.USER_DELETE)
    })

    it('super_user gets every permission', () => {
        const perms = permissionsForRole('super_user')
        expect(perms).toEqual(expect.arrayContaining(Object.values(PERMISSIONS)))
    })

    it('unknown roles get nothing', () => {
        expect(permissionsForRole('hacker')).toEqual([])
    })
})
