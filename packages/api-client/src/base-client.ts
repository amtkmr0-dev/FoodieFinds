import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_BASE_URL } from '@foodiefinds/shared'

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
    baseURL?: string
    timeout?: number
    headers?: Record<string, string>
    withCredentials?: boolean
}

/**
 * Base API client class that handles HTTP requests
 */
export class BaseApiClient {
    protected client: AxiosInstance
    protected config: ApiClientConfig

    constructor(config: ApiClientConfig = {}) {
        this.config = {
            baseURL: API_BASE_URL,
            timeout: 30000,
            withCredentials: true,
            ...config,
        }

        this.client = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            withCredentials: this.config.withCredentials,
        })

        // Add request interceptor for auth tokens
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getAuthToken()
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                // Log network errors for debugging
                if (error.code === 'ECONNABORTED') {
                    console.error('API request timeout:', error.config?.url)
                } else if (error.code === 'ERR_NETWORK') {
                    console.error('Network error - API server may be unreachable:', error.config?.baseURL)
                    console.error('Check if API_BASE_URL is correct and server is running')
                } else if (error.response?.status === 401) {
                    this.handleUnauthorized()
                } else {
                    console.error('API request failed:', {
                        url: error.config?.url,
                        method: error.config?.method,
                        status: error.response?.status,
                        message: error.message
                    })
                }
                return Promise.reject(error)
            }
        )
    }

    /**
     * Get authentication token from storage
     */
    protected getAuthToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('foodiefinds_auth_token')
    }

    /**
     * Handle unauthorized access (e.g., redirect to login)
     */
    protected handleUnauthorized(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('foodiefinds_auth_token')
            // Redirect to login page
            window.location.href = '/login'
        }
    }

    /**
     * Make a GET request
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.get(url, config)
        return response.data
    }

    /**
     * Make a POST request
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.post(url, data, config)
        return response.data
    }

    /**
     * Make a PUT request
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.put(url, data, config)
        return response.data
    }

    /**
     * Make a PATCH request
     */
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.patch(url, data, config)
        return response.data
    }

    /**
     * Make a DELETE request
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.delete(url, config)
        return response.data
    }

    /**
     * Set authentication token
     */
    setAuthToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('foodiefinds_auth_token', token)
        }
    }

    /**
     * Clear authentication token
     */
    clearAuthToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('foodiefinds_auth_token')
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getAuthToken()
    }
}

/**
 * Singleton instance of the base API client
 */
export const apiClient = new BaseApiClient()