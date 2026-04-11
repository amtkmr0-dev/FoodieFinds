import { apiClient, BaseApiClient } from './base-client'
import { CreatorAgentProfile, CreatorPricing, InsertCreatorPricing } from '@foodiefinds/shared'

/**
 * Creators API client for handling creator operations
 */
export class CreatorsApi {
    constructor(private client: BaseApiClient = apiClient) { }

    /**
     * Get all creators
     */
    async getAllCreators(): Promise<CreatorAgentProfile[]> {
        return this.client.get('/api/creators')
    }

    /**
     * Get a specific creator by ID
     */
    async getCreatorById(creatorId: string): Promise<CreatorAgentProfile> {
        return this.client.get(`/api/creators/${creatorId}`)
    }

    /**
     * Get creator performance metrics
     */
    async getCreatorPerformance(creatorId: string): Promise<{
        totalEarnings: number
        totalCalls: number
        averageRating: number
        totalGifts: number
        followers: number
    }> {
        return this.client.get(`/api/creators/${creatorId}/performance`)
    }

    /**
     * Get creator pricing
     */
    async getCreatorPricing(creatorId: string): Promise<CreatorPricing> {
        return this.client.get(`/api/creators/${creatorId}/pricing`)
    }

    /**
     * Update creator pricing (admin only)
     */
    async updateCreatorPricing(creatorId: string, data: InsertCreatorPricing): Promise<CreatorPricing> {
        return this.client.put(`/api/admin/creators/${creatorId}/pricing`, data)
    }

    /**
     * Get pending creator applications (admin only)
     */
    async getPendingCreators(): Promise<CreatorAgentProfile[]> {
        return this.client.get('/api/admin/creators/pending')
    }

    /**
     * Approve a creator application (admin only)
     */
    async approveCreator(creatorId: string): Promise<{ success: boolean }> {
        return this.client.post(`/api/admin/creators/${creatorId}/approve`)
    }

    /**
     * Reject a creator application (admin only)
     */
    async rejectCreator(creatorId: string, reason: string): Promise<{ success: boolean }> {
        return this.client.post(`/api/admin/creators/${creatorId}/reject`, { reason })
    }

    /**
     * Ban a creator (admin only)
     */
    async banCreator(creatorId: string): Promise<{ success: boolean }> {
        return this.client.post(`/api/admin/creators/${creatorId}/ban`)
    }

    /**
     * Get top creators by earnings
     */
    async getTopCreators(limit: number = 10): Promise<CreatorAgentProfile[]> {
        return this.client.get(`/api/creators/top?limit=${limit}`)
    }

    /**
     * Get creators by category
     */
    async getCreatorsByCategory(category: string): Promise<CreatorAgentProfile[]> {
        return this.client.get(`/api/creators/category/${category}`)
    }

    /**
     * Search creators by name or keyword
     */
    async searchCreators(query: string): Promise<CreatorAgentProfile[]> {
        return this.client.get(`/api/creators/search?q=${encodeURIComponent(query)}`)
    }

    /**
     * Follow a creator
     */
    async followCreator(userId: string, creatorId: string): Promise<{ success: boolean }> {
        return this.client.post(`/api/creators/${creatorId}/follow`, { userId })
    }

    /**
     * Unfollow a creator
     */
    async unfollowCreator(userId: string, creatorId: string): Promise<{ success: boolean }> {
        return this.client.post(`/api/creators/${creatorId}/unfollow`, { userId })
    }

    /**
     * Get followed creators for a user
     */
    async getFollowedCreators(userId: string): Promise<CreatorAgentProfile[]> {
        return this.client.get(`/api/users/${userId}/followed-creators`)
    }

    /**
     * Check if a user is following a creator
     */
    async isFollowing(userId: string, creatorId: string): Promise<{ isFollowing: boolean }> {
        return this.client.get(`/api/creators/${creatorId}/is-following?userId=${userId}`)
    }
}

/**
 * Singleton instance of the creators API client
 */
export const creatorsApi = new CreatorsApi()