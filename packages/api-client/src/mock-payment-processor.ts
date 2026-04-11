import { randomUUID } from 'crypto'
import {
    PaymentRequest,
    PaymentResponse,
    PaymentStatusCheck,
    PaymentRefund,
    WebhookPayload,
    PaymentProcessorConfig,
    PaymentErrorCode,
    TransactionStatus,
    generateTransactionId,
    generateGatewayTransactionId,
    calculateBonus,
    DEFAULT_BONUS_TIERS,
} from '@foodiefinds/shared'

/**
 * Mock Payment Processor Service
 * Simulates real payment gateway behavior with realistic delays, failures, and webhooks
 */

export interface PaymentProcessorOptions {
    config?: Partial<PaymentProcessorConfig>
    onWebhook?: ((payload: WebhookPayload) => void) | undefined
}

export class MockPaymentProcessor {
    private config: PaymentProcessorConfig
    private transactions: Map<string, PaymentResponse>
    private webhooks: Map<string, NodeJS.Timeout>
    private onWebhook?: (payload: WebhookPayload) => void

    constructor(options: PaymentProcessorOptions = {}) {
        this.config = {
            enableSimulation: true,
            successRate: 0.95,
            minDelay: 500,
            maxDelay: 3000,
            enableWebhooks: true,
            webhookDelay: 1000,
            ...options.config,
        }
        this.transactions = new Map()
        this.webhooks = new Map()
        this.onWebhook = options.onWebhook
    }

    /**
     * Process a payment request
     */
    async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
        const transactionId = generateTransactionId()
        const gatewayTransactionId = generateGatewayTransactionId()
        const now = new Date().toISOString()

        // Create initial pending response
        const response: PaymentResponse = {
            transactionId,
            status: 'pending',
            amount: request.amount,
            currency: request.currency || 'INR',
            paymentMethod: request.paymentMethod,
            createdAt: now,
            updatedAt: now,
            gatewayResponse: {
                gatewayTransactionId,
                gatewayStatus: 'pending',
                gatewayMessage: 'Payment initiated',
            },
        }

        this.transactions.set(transactionId, response)

        // Simulate payment processing
        if (this.config.enableSimulation) {
            this.simulatePaymentProcessing(transactionId, request)
        } else {
            // Immediate success for testing
            response.status = 'success'
            response.updatedAt = new Date().toISOString()
            response.gatewayResponse = {
                gatewayTransactionId,
                gatewayStatus: 'success',
                gatewayMessage: 'Payment successful',
            }
            this.transactions.set(transactionId, response)
        }

        return response
    }

    /**
     * Simulate payment processing with delays and potential failures
     */
    private simulatePaymentProcessing(transactionId: string, request: PaymentRequest): void {
        const delay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay

        setTimeout(() => {
            const transaction = this.transactions.get(transactionId)
            if (!transaction) return

            // Determine if payment should succeed or fail
            const isSuccess = Math.random() < this.config.successRate

            if (isSuccess) {
                transaction.status = 'success'
                transaction.gatewayResponse = {
                    gatewayTransactionId: transaction.gatewayResponse?.gatewayTransactionId,
                    gatewayStatus: 'success',
                    gatewayMessage: 'Payment successful',
                }
            } else {
                // Randomly select an error type
                const errorTypes: PaymentErrorCode[] = [
                    'CARD_DECLINED',
                    'NETWORK_ERROR',
                    'TIMEOUT',
                    'PROCESSING_ERROR',
                    'AUTHENTICATION_FAILED',
                ]
                const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)]!

                transaction.status = 'failed'
                transaction.error = {
                    code: errorType,
                    message: this.getErrorMessage(errorType),
                    details: 'Payment processing failed',
                }
                transaction.gatewayResponse = {
                    gatewayTransactionId: transaction.gatewayResponse?.gatewayTransactionId,
                    gatewayStatus: 'failed',
                    gatewayMessage: transaction.error?.message || 'Payment failed',
                }
            }

            transaction.updatedAt = new Date().toISOString()
            this.transactions.set(transactionId, transaction)

            // Send webhook if enabled
            if (this.config.enableWebhooks && this.onWebhook) {
                this.sendWebhook(transactionId)
            }
        }, delay)
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(check: PaymentStatusCheck): Promise<PaymentResponse | null> {
        return this.transactions.get(check.transactionId) || null
    }

    /**
     * Process a refund
     */
    async processRefund(refund: PaymentRefund): Promise<PaymentResponse> {
        const transaction = this.transactions.get(refund.transactionId)

        if (!transaction) {
            throw new Error('Transaction not found')
        }

        if (transaction.status !== 'success') {
            throw new Error('Cannot refund a non-successful transaction')
        }

        const refundTransactionId = generateTransactionId()
        const now = new Date().toISOString()

        const refundResponse: PaymentResponse = {
            transactionId: refundTransactionId,
            status: 'processing',
            amount: refund.amount || transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            createdAt: now,
            updatedAt: now,
            gatewayResponse: {
                gatewayTransactionId: generateGatewayTransactionId(),
                gatewayStatus: 'processing',
                gatewayMessage: 'Refund initiated',
            },
        }

        this.transactions.set(refundTransactionId, refundResponse)

        // Simulate refund processing
        setTimeout(() => {
            const refundTxn = this.transactions.get(refundTransactionId)
            if (refundTxn) {
                refundTxn.status = 'refunded'
                refundTxn.updatedAt = new Date().toISOString()
                refundTxn.gatewayResponse = {
                    gatewayTransactionId: refundTxn.gatewayResponse?.gatewayTransactionId,
                    gatewayStatus: 'success',
                    gatewayMessage: 'Refund successful',
                }
                this.transactions.set(refundTransactionId, refundTxn)

                // Send webhook
                if (this.config.enableWebhooks && this.onWebhook) {
                    this.sendWebhook(refundTransactionId)
                }
            }
        }, this.config.minDelay)

        return refundResponse
    }

    /**
     * Cancel a pending payment
     */
    async cancelPayment(transactionId: string): Promise<PaymentResponse> {
        const transaction = this.transactions.get(transactionId)

        if (!transaction) {
            throw new Error('Transaction not found')
        }

        if (transaction.status !== 'pending' && transaction.status !== 'processing') {
            throw new Error('Cannot cancel a transaction that is not pending or processing')
        }

        transaction.status = 'cancelled'
        transaction.updatedAt = new Date().toISOString()
        transaction.gatewayResponse = {
            gatewayTransactionId: transaction.gatewayResponse?.gatewayTransactionId,
            gatewayStatus: 'cancelled',
            gatewayMessage: 'Payment cancelled',
        }

        this.transactions.set(transactionId, transaction)

        // Clear any pending webhook
        const webhookTimeout = this.webhooks.get(transactionId)
        if (webhookTimeout) {
            clearTimeout(webhookTimeout)
            this.webhooks.delete(transactionId)
        }

        return transaction
    }

    /**
     * Send webhook notification
     */
    private sendWebhook(transactionId: string): void {
        const transaction = this.transactions.get(transactionId)
        if (!transaction || !this.onWebhook) return

        const webhookTimeout = setTimeout(() => {
            const eventType = this.getWebhookEventType(transaction.status)

            const payload: WebhookPayload = {
                eventType,
                transactionId: transaction.transactionId,
                timestamp: new Date().toISOString(),
                data: {
                    userId: transactionId.split('_')[0] || 'unknown', // Extract user ID from transaction ID
                    amount: transaction.amount,
                    currency: transaction.currency,
                    paymentMethod: transaction.paymentMethod,
                    status: transaction.status,
                },
            }

            this.onWebhook?.(payload)
            this.webhooks.delete(transactionId)
        }, this.config.webhookDelay)

        this.webhooks.set(transactionId, webhookTimeout)
    }

    /**
     * Get webhook event type based on transaction status
     */
    private getWebhookEventType(status: TransactionStatus): WebhookPayload['eventType'] {
        switch (status) {
            case 'success':
                return 'payment.success'
            case 'failed':
                return 'payment.failed'
            case 'pending':
                return 'payment.pending'
            case 'processing':
                return 'payment.processing'
            case 'refunded':
                return 'payment.refunded'
            case 'cancelled':
                return 'payment.cancelled'
            default:
                return 'payment.pending'
        }
    }

    /**
     * Get error message for error code
     */
    private getErrorMessage(code: PaymentErrorCode): string {
        const messages: Record<PaymentErrorCode, string> = {
            INSUFFICIENT_FUNDS: 'Insufficient funds in your account',
            CARD_DECLINED: 'Your card was declined by the bank',
            NETWORK_ERROR: 'Network error occurred during payment processing',
            TIMEOUT: 'Payment processing timed out',
            INVALID_AMOUNT: 'Invalid payment amount',
            INVALID_PAYMENT_METHOD: 'Invalid payment method selected',
            DUPLICATE_TRANSACTION: 'Duplicate transaction detected',
            PROCESSING_ERROR: 'An error occurred while processing your payment',
            AUTHENTICATION_FAILED: 'Authentication failed',
            RATE_LIMIT_EXCEEDED: 'Too many payment attempts. Please try again later',
        }
        return messages[code] || 'An unknown error occurred'
    }

    /**
     * Calculate bonus for a recharge amount
     */
    calculateBonus(amount: number): number {
        return calculateBonus(amount, DEFAULT_BONUS_TIERS)
    }

    /**
     * Get all transactions (for testing/debugging)
     */
    getAllTransactions(): PaymentResponse[] {
        return Array.from(this.transactions.values())
    }

    /**
     * Clear all transactions (for testing)
     */
    clearAllTransactions(): void {
        this.transactions.clear()
        this.webhooks.forEach(timeout => clearTimeout(timeout))
        this.webhooks.clear()
    }

    /**
     * Set custom success rate for testing
     */
    setSuccessRate(rate: number): void {
        this.config.successRate = Math.max(0, Math.min(1, rate))
    }

    /**
     * Set custom delay range for testing
     */
    setDelayRange(min: number, max: number): void {
        this.config.minDelay = Math.max(0, min)
        this.config.maxDelay = Math.max(min, max)
    }

    /**
     * Enable or disable webhooks
     */
    setWebhooksEnabled(enabled: boolean): void {
        this.config.enableWebhooks = enabled
    }
}

// Singleton instance
let mockPaymentProcessorInstance: MockPaymentProcessor | null = null

export function getMockPaymentProcessor(options?: PaymentProcessorOptions): MockPaymentProcessor {
    if (!mockPaymentProcessorInstance) {
        mockPaymentProcessorInstance = new MockPaymentProcessor(options)
    }
    return mockPaymentProcessorInstance
}

export function resetMockPaymentProcessor(): void {
    if (mockPaymentProcessorInstance) {
        mockPaymentProcessorInstance.clearAllTransactions()
    }
    mockPaymentProcessorInstance = null
}
