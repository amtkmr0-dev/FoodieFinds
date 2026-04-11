/**
 * Call Simulation API
 * 
 * This module provides a comprehensive simulation API for testing audio and video calls
 * without requiring actual WebRTC media streams. It simulates realistic call behavior,
 * state transitions, network conditions, and error scenarios.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'initiating' | 'connecting' | 'connected' | 'disconnected' | 'failed';
export type CallQuality = 'excellent' | 'good' | 'average' | 'poor' | 'terrible';
export type NetworkCondition = 'excellent' | 'good' | 'average' | 'poor' | 'unstable';

export interface CallSimulationConfig {
    /** Enable or disable simulation mode */
    enabled: boolean;
    /** Default call type */
    defaultCallType: CallType;
    /** Connection delay in milliseconds (simulates network latency) */
    connectionDelay: number;
    /** Call duration in seconds (0 for unlimited) */
    maxDuration: number;
    /** Call quality level */
    quality: CallQuality;
    /** Network condition simulation */
    networkCondition: NetworkCondition;
    /** Probability of call drop (0-1) */
    dropProbability: number;
    /** Probability of connection failure (0-1) */
    failureProbability: number;
    /** Enable automatic call termination on balance exhaustion */
    enableBalanceCheck: boolean;
    /** Minimum balance required to start a call */
    minBalance: number;
    /** Price per minute for calls */
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
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_SIMULATION_CONFIG: CallSimulationConfig = {
    enabled: false,
    defaultCallType: 'audio',
    connectionDelay: 2000,
    maxDuration: 0,
    quality: 'good',
    networkCondition: 'good',
    dropProbability: 0.05,
    failureProbability: 0.02,
    enableBalanceCheck: true,
    minBalance: 10,
    pricePerMinute: 5,
};

// ============================================================================
// CALL SIMULATION CLASS
// ============================================================================

export class CallSimulator extends EventEmitter {
    private config: CallSimulationConfig;
    private sessions: Map<string, CallSession> = new Map();
    private stats: CallStats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        droppedCalls: 0,
        averageDuration: 0,
        averageQuality: 0,
        totalDuration: 0,
    };
    private timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(config: Partial<CallSimulationConfig> = {}) {
        super();
        this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };
    }

    // ============================================================================
    // CONFIGURATION METHODS
    // ============================================================================

    /**
     * Update simulation configuration
     */
    updateConfig(updates: Partial<CallSimulationConfig>): void {
        this.config = { ...this.config, ...updates };
        this.emit('config-updated', this.config);
    }

    /**
     * Get current configuration
     */
    getConfig(): CallSimulationConfig {
        return { ...this.config };
    }

    /**
     * Enable or disable simulation mode
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        this.emit('simulation-toggled', enabled);
    }

    /**
     * Check if simulation is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================

    /**
     * Create a new call session
     */
    async createSession(
        userId: string,
        creatorId: string,
        callType: CallType = this.config.defaultCallType,
        metadata: Record<string, any> = {}
    ): Promise<CallSession> {
        if (!this.config.enabled) {
            throw new Error('Call simulation is disabled');
        }

        const sessionId = this.generateSessionId();
        const now = Date.now();

        const session: CallSession = {
            id: sessionId,
            userId,
            creatorId,
            callType,
            state: 'idle',
            startTime: now,
            duration: 0,
            quality: this.config.quality,
            networkCondition: this.config.networkCondition,
            latency: this.calculateLatency(),
            packetLoss: this.calculatePacketLoss(),
            bandwidth: this.calculateBandwidth(),
            events: [
                {
                    timestamp: now,
                    type: 'session-created',
                    data: { userId, creatorId, callType },
                },
            ],
            metadata,
        };

        this.sessions.set(sessionId, session);
        this.stats.totalCalls++;

        this.emit('session-created', session);
        return session;
    }

    /**
     * Get a session by ID
     */
    getSession(sessionId: string): CallSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get all active sessions
     */
    getActiveSessions(): CallSession[] {
        return Array.from(this.sessions.values()).filter(
            (s) => s.state === 'connected' || s.state === 'connecting'
        );
    }

    /**
     * Get all sessions
     */
    getAllSessions(): CallSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.clearSessionTimer(sessionId);
            this.sessions.delete(sessionId);
            this.emit('session-deleted', session);
            return true;
        }
        return false;
    }

    // ============================================================================
    // CALL CONTROL METHODS
    // ============================================================================

    /**
     * Initiate a call
     */
    async initiateCall(sessionId: string): Promise<CallSession> {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.state !== 'idle') {
            throw new Error(`Cannot initiate call in state: ${session.state}`);
        }

        // Check for connection failure
        if (Math.random() < this.config.failureProbability) {
            return this.failCall(sessionId, 'connection_failed');
        }

        // Update state to initiating
        session.state = 'initiating';
        this.addEvent(session, 'call-initiated');

        this.emit('call-initiated', session);

        // Simulate connection delay
        await this.delay(this.config.connectionDelay);

        // Transition to connecting
        session.state = 'connecting';
        this.addEvent(session, 'call-connecting');
        this.emit('call-connecting', session);

        // Simulate additional connection time
        await this.delay(this.config.connectionDelay / 2);

        // Transition to connected
        return this.connectCall(sessionId);
    }

    /**
     * Connect a call
     */
    async connectCall(sessionId: string): Promise<CallSession> {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.state = 'connected';
        session.startTime = Date.now();
        this.addEvent(session, 'call-connected');
        this.emit('call-connected', session);

        // Start duration timer
        this.startDurationTimer(sessionId);

        // Start quality monitoring
        this.startQualityMonitoring(sessionId);

        // Start call drop monitoring
        this.startDropMonitoring(sessionId);

        return session;
    }

    /**
     * End a call
     */
    async endCall(sessionId: string, reason: string = 'user_ended'): Promise<CallSession> {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.state === 'disconnected' || session.state === 'failed') {
            return session;
        }

        session.state = 'disconnected';
        session.endTime = Date.now();
        session.duration = Math.floor((session.endTime - session.startTime) / 1000);

        this.clearSessionTimer(sessionId);
        this.addEvent(session, 'call-ended', { reason, duration: session.duration });

        this.stats.successfulCalls++;
        this.stats.totalDuration += session.duration;
        this.updateAverageStats();

        this.emit('call-ended', session);
        return session;
    }

    /**
     * Fail a call
     */
    async failCall(sessionId: string, reason: string): Promise<CallSession> {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.state = 'failed';
        session.endTime = Date.now();
        session.duration = Math.floor((session.endTime - session.startTime) / 1000);

        this.clearSessionTimer(sessionId);
        this.addEvent(session, 'call-failed', { reason });

        this.stats.failedCalls++;
        this.updateAverageStats();

        this.emit('call-failed', session);
        return session;
    }

    /**
     * Drop a call (simulates network issues)
     */
    async dropCall(sessionId: string, reason: string = 'network_drop'): Promise<CallSession> {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.state = 'disconnected';
        session.endTime = Date.now();
        session.duration = Math.floor((session.endTime - session.startTime) / 1000);

        this.clearSessionTimer(sessionId);
        this.addEvent(session, 'call-dropped', { reason });

        this.stats.droppedCalls++;
        this.stats.totalDuration += session.duration;
        this.updateAverageStats();

        this.emit('call-dropped', session);
        return session;
    }

    // ============================================================================
    // QUALITY AND NETWORK SIMULATION
    // ============================================================================

    /**
     * Update call quality
     */
    updateQuality(sessionId: string, quality: CallQuality): void {
        const session = this.getSession(sessionId);
        if (!session) return;

        session.quality = quality;
        this.addEvent(session, 'quality-changed', { quality });
        this.emit('quality-changed', session);
    }

    /**
     * Update network condition
     */
    updateNetworkCondition(sessionId: string, condition: NetworkCondition): void {
        const session = this.getSession(sessionId);
        if (!session) return;

        session.networkCondition = condition;
        session.latency = this.calculateLatency();
        session.packetLoss = this.calculatePacketLoss();
        session.bandwidth = this.calculateBandwidth();

        this.addEvent(session, 'network-changed', {
            condition,
            latency: session.latency,
            packetLoss: session.packetLoss,
            bandwidth: session.bandwidth,
        });

        this.emit('network-changed', session);
    }

    /**
     * Get current call statistics
     */
    getStats(): CallStats {
        return { ...this.stats };
    }

    /**
     * Get simulation status
     */
    getStatus(): SimulationStatus {
        return {
            enabled: this.config.enabled,
            activeSessions: this.getActiveSessions().length,
            totalSessions: this.sessions.size,
            stats: this.getStats(),
        };
    }

    /**
     * Reset all statistics
     */
    resetStats(): void {
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            droppedCalls: 0,
            averageDuration: 0,
            averageQuality: 0,
            totalDuration: 0,
        };
        this.emit('stats-reset');
    }

    /**
     * Clear all sessions
     */
    clearAllSessions(): void {
        this.sessions.forEach((session) => {
            this.clearSessionTimer(session.id);
        });
        this.sessions.clear();
        this.emit('sessions-cleared');
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private generateSessionId(): string {
        return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private addEvent(session: CallSession, type: string, data?: any): void {
        session.events.push({
            timestamp: Date.now(),
            type,
            data,
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private calculateLatency(): number {
        const baseLatency: Record<NetworkCondition, number> = {
            excellent: 20,
            good: 50,
            average: 100,
            poor: 200,
            unstable: 300,
        };
        const base = baseLatency[this.config.networkCondition];
        return base + Math.random() * base * 0.5;
    }

    private calculatePacketLoss(): number {
        const baseLoss: Record<NetworkCondition, number> = {
            excellent: 0,
            good: 0.1,
            average: 0.5,
            poor: 2,
            unstable: 5,
        };
        const base = baseLoss[this.config.networkCondition];
        return base + Math.random() * base * 0.5;
    }

    private calculateBandwidth(): number {
        const baseBandwidth: Record<NetworkCondition, number> = {
            excellent: 5000,
            good: 2500,
            average: 1000,
            poor: 500,
            unstable: 250,
        };
        const base = baseBandwidth[this.config.networkCondition];
        return base + Math.random() * base * 0.3;
    }

    private startDurationTimer(sessionId: string): void {
        const timer = setInterval(() => {
            const session = this.getSession(sessionId);
            if (!session) {
                this.clearSessionTimer(sessionId);
                return;
            }

            if (session.state !== 'connected') {
                this.clearSessionTimer(sessionId);
                return;
            }

            const now = Date.now();
            session.duration = Math.floor((now - session.startTime) / 1000);

            // Check max duration
            if (this.config.maxDuration > 0 && session.duration >= this.config.maxDuration) {
                this.endCall(sessionId, 'max_duration_reached');
                return;
            }

            this.emit('duration-updated', session);
        }, 1000);

        this.timers.set(sessionId, timer);
    }

    private startQualityMonitoring(sessionId: string): void {
        const timer = setInterval(() => {
            const session = this.getSession(sessionId);
            if (!session || session.state !== 'connected') {
                this.clearSessionTimer(sessionId);
                return;
            }

            // Simulate quality fluctuations
            if (Math.random() < 0.1) {
                const qualities: CallQuality[] = ['excellent', 'good', 'average', 'poor', 'terrible'];
                const currentIndex = qualities.indexOf(session.quality);
                const change = Math.random() < 0.5 ? -1 : 1;
                const newIndex = Math.max(0, Math.min(qualities.length - 1, currentIndex + change));
                this.updateQuality(sessionId, qualities[newIndex]);
            }
        }, 5000);

        this.timers.set(`${sessionId}_quality`, timer);
    }

    private startDropMonitoring(sessionId: string): void {
        const timer = setInterval(() => {
            const session = this.getSession(sessionId);
            if (!session || session.state !== 'connected') {
                this.clearSessionTimer(sessionId);
                return;
            }

            // Check for call drop
            if (Math.random() < this.config.dropProbability) {
                this.dropCall(sessionId, 'network_drop');
            }
        }, 10000);

        this.timers.set(`${sessionId}_drop`, timer);
    }

    private clearSessionTimer(sessionId: string): void {
        const timer = this.timers.get(sessionId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(sessionId);
        }

        const qualityTimer = this.timers.get(`${sessionId}_quality`);
        if (qualityTimer) {
            clearInterval(qualityTimer);
            this.timers.delete(`${sessionId}_quality`);
        }

        const dropTimer = this.timers.get(`${sessionId}_drop`);
        if (dropTimer) {
            clearInterval(dropTimer);
            this.timers.delete(`${sessionId}_drop`);
        }
    }

    private updateAverageStats(): void {
        if (this.stats.successfulCalls > 0) {
            this.stats.averageDuration = this.stats.totalDuration / this.stats.successfulCalls;
        }
    }
}

// ============================================================================
// GLOBAL SIMULATOR INSTANCE
// ============================================================================

let globalSimulator: CallSimulator | null = null;

/**
 * Get or create the global call simulator instance
 */
export function getCallSimulator(config?: Partial<CallSimulationConfig>): CallSimulator {
    if (!globalSimulator) {
        globalSimulator = new CallSimulator(config);
    }
    return globalSimulator;
}

/**
 * Reset the global simulator instance
 */
export function resetCallSimulator(): void {
    if (globalSimulator) {
        globalSimulator.clearAllSessions();
        globalSimulator.removeAllListeners();
    }
    globalSimulator = null;
}
