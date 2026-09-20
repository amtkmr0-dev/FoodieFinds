import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for conditionally joining class names with Tailwind CSS
 * Uses clsx for conditional classes and tailwind-merge for merging Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format a number as Indian Rupees with consistent decimal places.
 *
 * Default locale-aware formatting (e.g. ₹1,00,000.00). Pass
 * `{ symbolOnly: true }` for the simpler `₹100.00` form used in places
 * where Intl is unavailable.
 *
 * Consolidated from `client/src/lib/currency.ts` and the previous shared
 * helper, per Manus review §2.3 "Duplicated Utility Functions".
 */
export function formatCurrency(
    amount: number | string,
    opts: { showDecimals?: boolean; symbolOnly?: boolean } = {},
): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (Number.isNaN(num)) return '₹0.00'

    if (opts.symbolOnly) {
        return opts.showDecimals === false ? `₹${Math.round(num)}` : `₹${num.toFixed(2)}`
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: opts.showDecimals === false ? 0 : 2,
        maximumFractionDigits: opts.showDecimals === false ? 0 : 2,
    }).format(num)
}

/** Parse `"₹1,000.00"` back to `1000`. */
export function parseCurrency(currencyString: string): number {
    const cleaned = currencyString.replace(/[₹,\s]/g, '')
    const parsed = parseFloat(cleaned)
    return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Format time duration in minutes:seconds
 */
export function formatTimeDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Debounce function for limiting frequent calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Check if running on mobile device
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
    )
}

/**
 * Get query parameter from URL
 */
export function getQueryParam(param: string): string | null {
    if (typeof window === 'undefined') return null
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(param)
}

/**
 * Set query parameter in URL without page reload
 */
export function setQueryParam(param: string, value: string): void {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set(param, value)
    window.history.pushState({}, '', url.toString())
}

/**
 * Format an Indian phone number for display: `+91 98765 43210`.
 *
 * Moved up from `client/src/lib/auth.ts` and `client/src/lib/config.ts`
 * which both had divergent implementations.
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    if (cleaned.length > 10) {
        const country = cleaned.slice(0, -10)
        const number = cleaned.slice(-10)
        return `+${country} ${number.slice(0, 5)} ${number.slice(5)}`
    }
    return phone
}
