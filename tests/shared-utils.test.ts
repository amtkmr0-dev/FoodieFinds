/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import {
    formatCurrency,
    parseCurrency,
    formatPhoneNumber,
} from '../packages/shared/src/utils'

describe('shared utils: currency', () => {
    it('formats integers in INR with grouping', () => {
        expect(formatCurrency(100000)).toMatch(/₹\s?1,00,000/)
    })

    it('respects symbolOnly mode', () => {
        expect(formatCurrency(99.5, { symbolOnly: true })).toBe('₹99.50')
        expect(formatCurrency(99.5, { symbolOnly: true, showDecimals: false })).toBe('₹100')
    })

    it('handles non-numeric input gracefully', () => {
        expect(formatCurrency('not-a-number')).toBe('₹0.00')
    })

    it('round-trips with parseCurrency (symbolOnly mode)', () => {
        const formatted = formatCurrency(1234.56, { symbolOnly: true })
        expect(parseCurrency(formatted)).toBeCloseTo(1234.56, 2)
    })
})

describe('shared utils: phone formatting', () => {
    it('formats 10-digit Indian numbers', () => {
        expect(formatPhoneNumber('9876543210')).toBe('+91 98765 43210')
    })

    it('keeps short numbers unchanged', () => {
        expect(formatPhoneNumber('123')).toBe('123')
    })

    it('handles country-coded numbers', () => {
        expect(formatPhoneNumber('14155552671')).toBe('+1 41555 52671')
    })
})
