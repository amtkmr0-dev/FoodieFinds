/**
 * Centralized payment methods configuration
 * Single source of truth for payment methods across the application
 */

import { LucideIcon } from "lucide-react";

export interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    enabled: boolean;
    processingTime?: string;
    fees?: string;
}

/**
 * Available payment methods
 * Import the actual icons when using this configuration
 */
export const PAYMENT_METHODS_CONFIG: Omit<PaymentMethod, 'icon'>[] = [
    {
        id: "upi",
        name: "UPI App",
        description: "Pay using any UPI app",
        color: "text-green-600 dark:text-green-400",
        enabled: true,
        processingTime: "Instant",
        fees: "No fees",
    },
    {
        id: "card",
        name: "Card",
        description: "Debit/Credit card payment",
        color: "text-blue-600 dark:text-blue-400",
        enabled: true,
        processingTime: "Instant",
        fees: "No fees",
    },
    {
        id: "netbanking",
        name: "Net Banking",
        description: "Pay via your bank account",
        color: "text-purple-600 dark:text-purple-400",
        enabled: true,
        processingTime: "2-3 minutes",
        fees: "No fees",
    },
];

/**
 * Get enabled payment methods
 */
export function getEnabledPaymentMethods(): Omit<PaymentMethod, 'icon'>[] {
    return PAYMENT_METHODS_CONFIG.filter(method => method.enabled);
}

/**
 * Get payment method by ID
 */
export function getPaymentMethodById(id: string): Omit<PaymentMethod, 'icon'> | undefined {
    return PAYMENT_METHODS_CONFIG.find(method => method.id === id);
}

/**
 * Check if payment method is enabled
 */
export function isPaymentMethodEnabled(id: string): boolean {
    const method = getPaymentMethodById(id);
    return method?.enabled ?? false;
}
