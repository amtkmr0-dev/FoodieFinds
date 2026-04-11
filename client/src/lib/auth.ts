/**
 * Client-side authentication utilities
 * Handles JWT token storage, session management, and authentication API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface AuthUser {
    userId: string;
    username?: string;
    phone?: string;
    role: 'user' | 'admin' | 'super_user' | 'support' | 'creator';
    deviceId?: string;
}

export interface AuthTokens {
    accessToken: string;
    user: AuthUser;
}

/**
 * Store access token in memory (not localStorage for security)
 */
let accessToken: string | null = null;

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
    return accessToken;
}

/**
 * Set access token
 */
export function setAccessToken(token: string): void {
    accessToken = token;
}

/**
 * Clear access token
 */
export function clearAccessToken(): void {
    accessToken = null;
}

/**
 * Get user info from token
 */
export function getUserFromToken(): AuthUser | null {
    if (!accessToken) return null;

    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        return {
            userId: payload.userId,
            role: payload.role,
            deviceId: payload.deviceId
        };
    } catch (error) {
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return accessToken !== null;
}

/**
 * Check if user has specific role
 */
export function hasRole(...roles: string[]): boolean {
    const user = getUserFromToken();
    if (!user) return false;
    return roles.includes(user.role);
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; otp?: string; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Failed to send OTP' };
        }

        return { success: true, otp: data.otp };
    } catch (error: any) {
        return { success: false, error: error.message || 'Network error' };
    }
}

/**
 * Verify OTP and authenticate user
 */
export async function verifyOTP(phone: string, otp: string, deviceId?: string): Promise<{ success: boolean; tokens?: AuthTokens; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, deviceId }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'OTP verification failed' };
        }

        // Store access token
        setAccessToken(data.accessToken);

        // Store user info in localStorage for persistence (non-sensitive data only)
        localStorage.setItem('auth_user', JSON.stringify(data.user));

        return { success: true, tokens: data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Network error' };
    }
}

/**
 * Admin login
 */
export async function adminLogin(username: string, password: string): Promise<{ success: boolean; tokens?: AuthTokens; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Login failed' };
        }

        // Store access token
        setAccessToken(data.accessToken);

        // Store admin info in localStorage
        localStorage.setItem('admin_user', JSON.stringify(data.user));

        return { success: true, tokens: data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Network error' };
    }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return false;
        }

        setAccessToken(data.accessToken);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Logout user
 */
export async function logout(): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        });

        // Clear local storage
        clearAccessToken();
        localStorage.removeItem('auth_user');
        localStorage.removeItem('admin_user');

        return { success: true };
    } catch (error: any) {
        // Clear local storage even on error
        clearAccessToken();
        localStorage.removeItem('auth_user');
        localStorage.removeItem('admin_user');
        return { success: false, error: error.message };
    }
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/admin/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        });

        // Clear local storage
        clearAccessToken();
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_registered');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_name');

        return { success: true };
    } catch (error: any) {
        // Clear local storage even on error
        clearAccessToken();
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_registered');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_name');
        return { success: false, error: error.message };
    }
}

/**
 * Verify session with server
 */
export async function verifySession(): Promise<{ valid: boolean; user?: AuthUser }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            return { valid: false };
        }

        return { valid: true, user: data.user };
    } catch (error) {
        return { valid: false };
    }
}

/**
 * Get remaining session time in milliseconds
 */
export function getSessionRemainingTime(): number {
    if (!accessToken) return 0;

    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = payload.exp * 1000;
        const remaining = exp - Date.now();
        return Math.max(0, remaining);
    } catch (error) {
        return 0;
    }
}

/**
 * Check if session is expiring soon (within 5 minutes)
 */
export function isSessionExpiringSoon(): boolean {
    const remaining = getSessionRemainingTime();
    return remaining > 0 && remaining <= 5 * 60 * 1000;
}

/**
 * Generate browser-compatible UUID with fallback
 */
export function generateUUID(): string {
    // Try crypto.randomUUID first (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fall back to custom implementation
        }
    }

    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get stored user info from localStorage
 */
export function getStoredUser(): AuthUser | null {
    try {
        const userStr = localStorage.getItem('auth_user') || localStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        return null;
    }
}

/**
 * Restore session from localStorage
 */
export function restoreSession(): boolean {
    const user = getStoredUser();
    if (user) {
        // Note: Access token is not stored in localStorage for security
        // User will need to re-authenticate or use refresh token
        return true;
    }
    return false;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length <= 10) {
        return numbers;
    }
    return numbers.slice(0, 10);
}
