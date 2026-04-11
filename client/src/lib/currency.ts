/**
 * Currency formatting utilities for consistent display across the application
 */

/**
 * Format a number as Indian Rupees with consistent decimal places
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string (e.g., "₹100.00" or "₹100")
 */
export function formatCurrency(amount: number | string, showDecimals: boolean = true): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return '₹0.00';
    }

    if (showDecimals) {
        return `₹${numAmount.toFixed(2)}`;
    }

    return `₹${Math.round(numAmount)}`;
}

/**
 * Format a number as Indian Rupees with locale-specific formatting
 * Uses Indian numbering system (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted currency string with locale formatting
 */
export function formatCurrencyLocale(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return '₹0.00';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numAmount);
}

/**
 * Parse a currency string back to a number
 * @param currencyString - The currency string to parse (e.g., "₹100.00")
 * @returns The numeric value
 */
export function parseCurrency(currencyString: string): number {
    const cleaned = currencyString.replace(/[₹,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
