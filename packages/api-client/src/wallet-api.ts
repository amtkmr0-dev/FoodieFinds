import { apiClient, BaseApiClient } from './base-client'
import { UserWallet, RechargeTransaction, rechargeTransactionSchema, insertCallTransactionSchema, CallTransaction, PaymentMethod } from '@foodiefinds/shared'

/**
 * Wallet API client for handling wallet operations
 */
export class WalletApi {
    constructor(private client: BaseApiClient = apiClient) { }

    /**
     * Get wallet balance for a user
     */
    async getWallet(userId: string): Promise<UserWallet> {
        return this.client.get(`/api/wallet/${userId}`)
    }

    /**
     * Recharge wallet
     */
    async recharge(data: {
        userId: string
        amount: number
        paymentMethod: PaymentMethod
    }): Promise<{ success: boolean; wallet: UserWallet }> {
        return this.client.post('/api/wallet/recharge', data)
    }

    /**
     * Deduct from wallet for a call
     */
    async deductForCall(data: {
        userId: string
        creatorId: string
        callType: 'audio' | 'video'
        durationSeconds: number
        pricePerMinute: number
        totalCost: string
    }): Promise<{ success: boolean; wallet: UserWallet }> {
        return this.client.post('/api/wallet/deduct-call', data)
    }

    /**
     * Get recharge history for a user
     */
    async getRechargeHistory(userId: string): Promise<RechargeTransaction[]> {
        return this.client.get(`/api/wallet/${userId}/recharge-history`)
    }

    /**
     * Get call transaction history for a user
     */
    async getCallHistory(userId: string): Promise<CallTransaction[]> {
        return this.client.get(`/api/wallet/${userId}/call-history`)
    }

    /**
     * Get gift transaction history for a user
     */
    async getGiftHistory(userId: string): Promise<any[]> {
        return this.client.get(`/api/wallet/${userId}/gift-history`)
    }
}

/**
 * Singleton instance of the wallet API client
 */
export const walletApi = new WalletApi()