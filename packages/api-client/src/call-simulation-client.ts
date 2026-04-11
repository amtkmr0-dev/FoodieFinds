/**
 * Call Simulation Client API
 * 
 * Client-side utilities for interacting with the call simulation API.
 * Provides a convenient interface for testing call functionality without
 * requiring actual WebRTC connections.
 */

// ============================================================================
// TYPES
// ============================================================================

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'initiating' | 'connecting' | 'connected' | 'disconnected' | 'failed';
export type CallQuality = 'excellent' | 'good' | 'average' | 'poor' | 'terrible';
export type NetworkCondition = 'excellent' | 'good' | 'average' | 'poor' | 'unstable';

export interface CallSimulationConfig {
    enabled: boolean;
    defaultCallType: CallType;
    connectionDelay: number;
    maxDuration: number;
    quality: CallQuality;
    networkCondition: NetworkCondition;
    dropProbability: number;
    failureProbability: number;
    enableBalanceCheck: boolean;
    minBalance: number;
    pricePerMinute: number;
}

export interface CallSession {
    id: string;
    userId: string;
    creatorId: string;
    callType: CallType;
    state: CallState;
    startTime: number;
    endTime?: number;
    duration: number;
    quality: CallQuality;
    networkCondition: NetworkCondition;
    latency: number;
    packetLoss: number;
    bandwidth: number;
    events: CallEvent[];
    metadata: Record<string, any>;
}

export interface CallEvent {
    timestamp: number;
    type: string;
    data?: any;
}

export interface CallStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    droppedCalls: number;
    averageDuration: number;
    averageQuality: number;
    totalDuration: number;
}

export interface SimulationStatus {
    enabled: boolean;
    activeSessions: number;
    totalSessions: number;
    stats: CallStats;
}

// ============================================================================
// API CLIENT
// ============================================================================

class CallSimulationClient {
    private baseUrl: string;
    private enabled: boolean;

    constructor(baseUrl: string = '/api/simulation') {
        this.baseUrl = baseUrl;
        this.enabled = false;
    }

    /**
     * Set the base URL for the API
     */
    setBaseUrl(url: string): void {
        this.baseUrl = url;
    }

    /**
     * Check if simulation is enabled
     */
    async isEnabled(): Promise<boolean> {
        try {
            const status = await this.getStatus();
            this.enabled = status.enabled;
            return status.enabled;
        } catch (error) {
            console.error('Failed to check simulation status:', error);
            return false;
        }
    }

    /**
     * Toggle simulation on/off
     */
    async toggleSimulation(enabled: boolean): Promise<{ success: boolean; enabled: boolean }> {
        const response = await fetch(`${this.baseUrl}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
            throw new Error(`Failed to toggle simulation: ${response.statusText}`);
        }

        const result = await response.json();
        this.enabled = result.enabled;
        return result;
    }

    /**
     * Get simulation status
     */
    async getStatus(): Promise<SimulationStatus> {
        const response = await fetch(`${this.baseUrl}/status`);

        if (!response.ok) {
            throw new Error(`Failed to get simulation status: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get simulation configuration
     */
    async getConfig(): Promise<CallSimulationConfig> {
        const response = await fetch(`${this.baseUrl}/config`);

        if (!response.ok) {
            throw new Error(`Failed to get simulation config: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Update simulation configuration
     */
    async updateConfig(config: Partial<CallSimulationConfig>): Promise<{ success: boolean; config: CallSimulationConfig }> {
        const response = await fetch(`${this.baseUrl}/config`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            throw new Error(`Failed to update simulation config: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Create a new call session
     */
    async createSession(
        userId: string,
        creatorId: string,
        callType: CallType = 'audio',
        metadata: Record<string, any> = {}
    ): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, creatorId, callType, metadata }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create session: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get a specific session
     */
    async getSession(sessionId: string): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/session/${sessionId}`);

        if (!response.ok) {
            throw new Error(`Failed to get session: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get all active sessions
     */
    async getActiveSessions(): Promise<CallSession[]> {
        const response = await fetch(`${this.baseUrl}/sessions/active`);

        if (!response.ok) {
            throw new Error(`Failed to get active sessions: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get all sessions
     */
    async getAllSessions(): Promise<CallSession[]> {
        const response = await fetch(`${this.baseUrl}/sessions`);

        if (!response.ok) {
            throw new Error(`Failed to get sessions: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Delete a session
     */
    async deleteSession(sessionId: string): Promise<{ success: boolean }> {
        const response = await fetch(`${this.baseUrl}/session/${sessionId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete session: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Initiate a call
     */
    async initiateCall(sessionId: string): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to initiate call: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Connect a call
     */
    async connectCall(sessionId: string): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to connect call: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * End a call
     */
    async endCall(sessionId: string, reason: string = 'user_ended'): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, reason }),
        });

        if (!response.ok) {
            throw new Error(`Failed to end call: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Fail a call
     */
    async failCall(sessionId: string, reason: string = 'unknown'): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, reason }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fail call: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Drop a call
     */
    async dropCall(sessionId: string, reason: string = 'network_drop'): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/drop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, reason }),
        });

        if (!response.ok) {
            throw new Error(`Failed to drop call: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Update call quality
     */
    async updateQuality(sessionId: string, quality: CallQuality): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/${sessionId}/quality`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quality }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update quality: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Update network condition
     */
    async updateNetworkCondition(sessionId: string, condition: NetworkCondition): Promise<CallSession> {
        const response = await fetch(`${this.baseUrl}/call/${sessionId}/network`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ condition }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update network condition: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get simulation statistics
     */
    async getStats(): Promise<CallStats> {
        const response = await fetch(`${this.baseUrl}/stats`);

        if (!response.ok) {
            throw new Error(`Failed to get stats: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Reset simulation statistics
     */
    async resetStats(): Promise<{ success: boolean }> {
        const response = await fetch(`${this.baseUrl}/stats/reset`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Failed to reset stats: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Clear all sessions
     */
    async clearAllSessions(): Promise<{ success: boolean }> {
        const response = await fetch(`${this.baseUrl}/sessions`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to clear sessions: ${response.statusText}`);
        }

        return response.json();
    }
}

// ============================================================================
// GLOBAL CLIENT INSTANCE
// ============================================================================

let globalClient: CallSimulationClient | null = null;

/**
 * Get or create the global call simulation client instance
 */
export function getCallSimulationClient(baseUrl?: string): CallSimulationClient {
    if (!globalClient) {
        globalClient = new CallSimulationClient(baseUrl);
    }
    return globalClient;
}

/**
 * Reset the global client instance
 */
export function resetCallSimulationClient(): void {
    globalClient = null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get quality color for UI
 */
export function getQualityColor(quality: CallQuality): string {
    const colors: Record<CallQuality, string> = {
        excellent: 'text-green-500',
        good: 'text-blue-500',
        average: 'text-yellow-500',
        poor: 'text-orange-500',
        terrible: 'text-red-500',
    };
    return colors[quality];
}

/**
 * Get network condition color for UI
 */
export function getNetworkColor(condition: NetworkCondition): string {
    const colors: Record<NetworkCondition, string> = {
        excellent: 'text-green-500',
        good: 'text-blue-500',
        average: 'text-yellow-500',
        poor: 'text-orange-500',
        unstable: 'text-red-500',
    };
    return colors[condition];
}

/**
 * Get call state label
 */
export function getCallStateLabel(state: CallState): string {
    const labels: Record<CallState, string> = {
        idle: 'Idle',
        initiating: 'Initiating...',
        connecting: 'Connecting...',
        connected: 'Connected',
        disconnected: 'Disconnected',
        failed: 'Failed',
    };
    return labels[state];
}

/**
 * Check if call is active
 */
export function isCallActive(state: CallState): boolean {
    return state === 'connected' || state === 'connecting' || state === 'initiating';
}

/**
 * Check if call can be ended
 */
export function canEndCall(state: CallState): boolean {
    return state === 'connected';
}

/**
 * Calculate call cost based on duration and price per minute
 */
export function calculateCallCost(durationSeconds: number, pricePerMinute: number): number {
    const billableMinutes = Math.ceil(durationSeconds / 60);
    return billableMinutes * pricePerMinute;
}

/**
 * Get remaining time based on balance and price per minute
 */
export function getRemainingTime(balance: number, pricePerMinute: number): number {
    return Math.floor((balance / pricePerMinute) * 60);
}

/**
 * Check if balance is sufficient for minimum call duration
 */
export function isBalanceSufficient(balance: number, pricePerMinute: number, minMinutes: number = 3): boolean {
    const minCost = minMinutes * pricePerMinute;
    return balance >= minCost;
}
