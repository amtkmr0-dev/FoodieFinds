import { apiClient, BaseApiClient } from './base-client'
import { AdminUser, InsertAdminUser, CreatorAgentProfile, InsertCreatorAgentProfile } from '@foodiefinds/shared'

/**
 * Authentication API client for handling auth operations
 */
export class AuthApi {
    constructor(private client: BaseApiClient = apiClient) { }

    /**
     * Send OTP for admin login
     */
    async sendAdminOTP(mobileNumber: string): Promise<{ success: boolean; message: string }> {
        return this.client.post('/api/admin/send-otp', { mobileNumber })
    }

    /**
     * Verify OTP for admin login
     */
    async verifyAdminOTP(mobileNumber: string, otp: string): Promise<{
        success: boolean
        token: string
        admin: AdminUser
    }> {
        return this.client.post('/api/admin/verify-otp', { mobileNumber, otp })
    }

    /**
     * Send OTP for creator/agent login
     */
    async sendCreatorOTP(mobileNumber: string): Promise<{ success: boolean; message: string }> {
        return this.client.post('/api/creator/send-otp', { mobileNumber })
    }

    /**
     * Verify OTP for creator/agent login
     */
    async verifyCreatorOTP(mobileNumber: string, otp: string): Promise<{
        success: boolean
        token: string
        profile: CreatorAgentProfile
    }> {
        return this.client.post('/api/creator/verify-otp', { mobileNumber, otp })
    }

    /**
     * Register as a creator or agent
     */
    async registerCreatorAgent(data: InsertCreatorAgentProfile): Promise<{
        success: boolean
        profile: CreatorAgentProfile
    }> {
        return this.client.post('/api/creator/register', data)
    }

    /**
     * Get current admin user
     */
    async getCurrentAdmin(): Promise<AdminUser> {
        return this.client.get('/api/admin/me')
    }

    /**
     * Get current creator/agent profile
     */
    async getCurrentCreator(): Promise<CreatorAgentProfile> {
        return this.client.get('/api/creator/me')
    }

    /**
     * Logout (invalidate token)
     */
    async logout(): Promise<{ success: boolean }> {
        return this.client.post('/api/auth/logout')
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(): Promise<{ token: string }> {
        return this.client.post('/api/auth/refresh')
    }

    /**
     * Validate authentication token
     */
    async validateToken(): Promise<{ valid: boolean; role: string }> {
        return this.client.get('/api/auth/validate')
    }

    /**
     * Get all admin users (super admin only)
     */
    async getAllAdmins(): Promise<AdminUser[]> {
        return this.client.get('/api/admin/users')
    }

    /**
     * Create a new admin user (super admin only)
     */
    async createAdmin(data: InsertAdminUser): Promise<AdminUser> {
        return this.client.post('/api/admin/users', data)
    }

    /**
     * Update admin user (super admin only)
     */
    async updateAdmin(adminId: string, data: Partial<InsertAdminUser>): Promise<AdminUser> {
        return this.client.patch(`/api/admin/users/${adminId}`, data)
    }

    /**
     * Delete admin user (super admin only)
     */
    async deleteAdmin(adminId: string): Promise<{ success: boolean }> {
        return this.client.delete(`/api/admin/users/${adminId}`)
    }

    /**
     * Get admin permissions
     */
    async getAdminPermissions(): Promise<{
        canSeeKYC: boolean
        canSeePricing: boolean
        canSeeGifts: boolean
        canSeeAdmins: boolean
        canSeeSupport: boolean
    }> {
        return this.client.get('/api/admin/permissions')
    }
}

/**
 * Singleton instance of the auth API client
 */
export const authApi = new AuthApi()