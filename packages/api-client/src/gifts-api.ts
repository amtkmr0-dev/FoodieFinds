import { apiClient, BaseApiClient } from './base-client'
import { GiftConfig, InsertGiftConfig, GiftTransaction, InsertGiftTransaction } from '@foodiefinds/shared'

/**
 * Gifts API client for handling gift operations
 */
export class GiftsApi {
    constructor(private client: BaseApiClient = apiClient) { }

    /**
     * Get all active gifts
     */
    async getActiveGifts(): Promise<GiftConfig[]> {
        return this.client.get('/api/gifts')
    }

    /**
     * Send a gift to a creator
     */
    async sendGift(data: {
        senderId: string
        receiverId: string
        giftId: string
        quantity: number
        message?: string
    }): Promise<{ success: boolean; transaction: GiftTransaction }> {
        return this.client.post('/api/gifts/send', data)
    }

    /**
     * Get all gifts (admin only)
     */
    async getAllGifts(): Promise<GiftConfig[]> {
        return this.client.get('/api/admin/gifts')
    }

    /**
     * Create a new gift (admin only)
     */
    async createGift(data: InsertGiftConfig): Promise<GiftConfig> {
        return this.client.post('/api/admin/gifts', data)
    }

    /**
     * Update a gift (admin only)
     */
    async updateGift(id: string, data: Partial<InsertGiftConfig>): Promise<GiftConfig> {
        return this.client.patch(`/api/admin/gifts/${id}`, data)
    }

    /**
     * Delete a gift (admin only)
     */
    async deleteGift(id: string): Promise<{ success: boolean }> {
        return this.client.delete(`/api/admin/gifts/${id}`)
    }

    /**
     * Get gift transactions for a user
     */
    async getUserGiftTransactions(userId: string): Promise<GiftTransaction[]> {
        return this.client.get(`/api/gifts/user/${userId}`)
    }

    /**
     * Get gift transactions received by a creator
     */
    async getCreatorGiftTransactions(creatorId: string): Promise<GiftTransaction[]> {
        return this.client.get(`/api/gifts/creator/${creatorId}`)
    }
}

/**
 * Singleton instance of the gifts API client
 */
export const giftsApi = new GiftsApi()