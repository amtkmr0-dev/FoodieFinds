/**
 * React Hook for Call Simulation
 * 
 * Provides a convenient interface for managing call simulation state
 * and interacting with the simulation API in React components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    getCallSimulationClient,
    type CallSession,
    type CallSimulationConfig,
    type CallStats,
    type SimulationStatus,
    type CallType,
    type CallState,
    type CallQuality,
    type NetworkCondition,
    formatDuration,
    getQualityColor,
    getNetworkColor,
    getCallStateLabel,
    isCallActive,
    canEndCall,
    calculateCallCost,
    getRemainingTime,
    isBalanceSufficient,
} from '@foodiefinds/api-client';

export interface UseCallSimulationOptions {
    /** Auto-refresh session interval in milliseconds (0 to disable) */
    refreshInterval?: number;
    /** Enable toast notifications for call events */
    enableNotifications?: boolean;
    /** Callback when call state changes */
    onStateChange?: (state: CallState, previousState: CallState) => void;
    /** Callback when call ends */
    onCallEnd?: (session: CallSession) => void;
    /** Callback when call fails */
    onCallFail?: (session: CallSession) => void;
    /** Callback when call drops */
    onCallDrop?: (session: CallSession) => void;
}

export interface CallSimulationState {
    /** Current session */
    session: CallSession | null;
    /** Simulation enabled status */
    enabled: boolean;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Current call state */
    callState: CallState;
    /** Call duration in seconds */
    duration: number;
    /** Call quality */
    quality: CallQuality;
    /** Network condition */
    networkCondition: NetworkCondition;
    /** Network latency in ms */
    latency: number;
    /** Packet loss percentage */
    packetLoss: number;
    /** Bandwidth in kbps */
    bandwidth: number;
    /** Simulation statistics */
    stats: CallStats | null;
    /** Whether call is active */
    isActive: boolean;
    /** Whether call can be ended */
    canEnd: boolean;
}

export function useCallSimulation(options: UseCallSimulationOptions = {}) {
    const {
        refreshInterval = 1000,
        enableNotifications = true,
        onStateChange,
        onCallEnd,
        onCallFail,
        onCallDrop,
    } = options;

    const client = getCallSimulationClient();
    const { toast } = useToast();
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const previousStateRef = useRef<CallState>('idle');

    const [state, setState] = useState<CallSimulationState>({
        session: null,
        enabled: false,
        loading: false,
        error: null,
        callState: 'idle',
        duration: 0,
        quality: 'good',
        networkCondition: 'good',
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        stats: null,
        isActive: false,
        canEnd: false,
    });

    // Update state helper
    const updateState = useCallback((updates: Partial<CallSimulationState>) => {
        setState((prev) => {
            const newState = { ...prev, ...updates };

            // Check for state changes
            if (updates.callState && updates.callState !== previousStateRef.current) {
                previousStateRef.current = updates.callState;
                onStateChange?.(updates.callState, previousStateRef.current);
            }

            return newState;
        });
    }, [onStateChange]);

    // Refresh session data
    const refreshSession = useCallback(async () => {
        if (!state.session?.id) return;

        try {
            const session = await client.getSession(state.session.id);

            // Check for call end
            if (session.state === 'disconnected' && state.callState === 'connected') {
                onCallEnd?.(session);
                if (enableNotifications) {
                    toast({
                        title: 'Call Ended',
                        description: `Call duration: ${formatDuration(session.duration)}`,
                    });
                }
            }

            // Check for call failure
            if (session.state === 'failed' && state.callState !== 'failed') {
                onCallFail?.(session);
                if (enableNotifications) {
                    toast({
                        title: 'Call Failed',
                        description: session.events.find(e => e.type === 'call-failed')?.data?.reason || 'Unknown error',
                        variant: 'destructive',
                    });
                }
            }

            // Check for call drop
            const dropEvent = session.events.find(e => e.type === 'call-dropped');
            if (dropEvent && state.callState === 'connected') {
                onCallDrop?.(session);
                if (enableNotifications) {
                    toast({
                        title: 'Call Dropped',
                        description: dropEvent.data?.reason || 'Network issue',
                        variant: 'destructive',
                    });
                }
            }

            updateState({
                session,
                callState: session.state,
                duration: session.duration,
                quality: session.quality,
                networkCondition: session.networkCondition,
                latency: session.latency,
                packetLoss: session.packetLoss,
                bandwidth: session.bandwidth,
                isActive: isCallActive(session.state),
                canEnd: canEndCall(session.state),
            });
        } catch (error) {
            console.error('Failed to refresh session:', error);
        }
    }, [state.session?.id, state.callState, client, updateState, onCallEnd, onCallFail, onCallDrop, enableNotifications, toast]);

    // Initialize simulation
    const initialize = useCallback(async () => {
        updateState({ loading: true, error: null });

        try {
            const status = await client.getStatus();
            const stats = await client.getStats();

            updateState({
                enabled: status.enabled,
                stats,
                loading: false,
            });
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to initialize simulation',
                loading: false,
            });
        }
    }, [client, updateState]);

    // Toggle simulation
    const toggleSimulation = useCallback(async (enabled: boolean) => {
        updateState({ loading: true, error: null });

        try {
            await client.toggleSimulation(enabled);
            updateState({
                enabled,
                loading: false,
            });

            if (enableNotifications) {
                toast({
                    title: 'Simulation Toggled',
                    description: enabled ? 'Call simulation enabled' : 'Call simulation disabled',
                });
            }
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to toggle simulation',
                loading: false,
            });
        }
    }, [client, updateState, enableNotifications, toast]);

    // Create session
    const createSession = useCallback(async (
        userId: string,
        creatorId: string,
        callType: CallType = 'audio',
        metadata: Record<string, any> = {}
    ) => {
        updateState({ loading: true, error: null });

        try {
            const session = await client.createSession(userId, creatorId, callType, metadata);

            updateState({
                session,
                callState: session.state,
                duration: session.duration,
                quality: session.quality,
                networkCondition: session.networkCondition,
                latency: session.latency,
                packetLoss: session.packetLoss,
                bandwidth: session.bandwidth,
                isActive: isCallActive(session.state),
                canEnd: canEndCall(session.state),
                loading: false,
            });

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to create session',
                loading: false,
            });
            throw error;
        }
    }, [client, updateState]);

    // Initiate call
    const initiateCall = useCallback(async () => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        updateState({ loading: true, error: null });

        try {
            const session = await client.initiateCall(state.session.id);

            updateState({
                session,
                callState: session.state,
                loading: false,
            });

            if (enableNotifications) {
                toast({
                    title: 'Call Initiated',
                    description: 'Connecting to creator...',
                });
            }

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to initiate call',
                loading: false,
            });
            throw error;
        }
    }, [state.session?.id, client, updateState, enableNotifications, toast]);

    // Connect call
    const connectCall = useCallback(async () => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        updateState({ loading: true, error: null });

        try {
            const session = await client.connectCall(state.session.id);

            updateState({
                session,
                callState: session.state,
                loading: false,
            });

            if (enableNotifications) {
                toast({
                    title: 'Call Connected',
                    description: 'You are now connected',
                });
            }

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to connect call',
                loading: false,
            });
            throw error;
        }
    }, [state.session?.id, client, updateState, enableNotifications, toast]);

    // End call
    const endCall = useCallback(async (reason: string = 'user_ended') => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        updateState({ loading: true, error: null });

        try {
            const session = await client.endCall(state.session.id, reason);

            updateState({
                session,
                callState: session.state,
                duration: session.duration,
                isActive: isCallActive(session.state),
                canEnd: canEndCall(session.state),
                loading: false,
            });

            if (enableNotifications) {
                toast({
                    title: 'Call Ended',
                    description: `Duration: ${formatDuration(session.duration)}`,
                });
            }

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to end call',
                loading: false,
            });
            throw error;
        }
    }, [state.session?.id, client, updateState, enableNotifications, toast]);

    // Fail call
    const failCall = useCallback(async (reason: string = 'unknown') => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        updateState({ loading: true, error: null });

        try {
            const session = await client.failCall(state.session.id, reason);

            updateState({
                session,
                callState: session.state,
                isActive: isCallActive(session.state),
                canEnd: canEndCall(session.state),
                loading: false,
            });

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to fail call',
                loading: false,
            });
            throw error;
        }
    }, [state.session?.id, client, updateState]);

    // Drop call
    const dropCall = useCallback(async (reason: string = 'network_drop') => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        updateState({ loading: true, error: null });

        try {
            const session = await client.dropCall(state.session.id, reason);

            updateState({
                session,
                callState: session.state,
                isActive: isCallActive(session.state),
                canEnd: canEndCall(session.state),
                loading: false,
            });

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to drop call',
                loading: false,
            });
            throw error;
        }
    }, [state.session?.id, client, updateState]);

    // Update quality
    const updateQuality = useCallback(async (quality: CallQuality) => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        try {
            const session = await client.updateQuality(state.session.id, quality);

            updateState({
                session,
                quality: session.quality,
            });

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to update quality',
            });
            throw error;
        }
    }, [state.session?.id, client, updateState]);

    // Update network condition
    const updateNetworkCondition = useCallback(async (condition: NetworkCondition) => {
        if (!state.session?.id) {
            throw new Error('No active session');
        }

        try {
            const session = await client.updateNetworkCondition(state.session.id, condition);

            updateState({
                session,
                networkCondition: session.networkCondition,
                latency: session.latency,
                packetLoss: session.packetLoss,
                bandwidth: session.bandwidth,
            });

            return session;
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to update network condition',
            });
            throw error;
        }
    }, [state.session?.id, client, updateState]);

    // Reset stats
    const resetStats = useCallback(async () => {
        updateState({ loading: true, error: null });

        try {
            await client.resetStats();
            const stats = await client.getStats();

            updateState({
                stats,
                loading: false,
            });
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to reset stats',
                loading: false,
            });
        }
    }, [client, updateState]);

    // Clear session
    const clearSession = useCallback(async () => {
        if (!state.session?.id) return;

        try {
            await client.deleteSession(state.session.id);

            updateState({
                session: null,
                callState: 'idle',
                duration: 0,
                isActive: false,
                canEnd: false,
            });
        } catch (error: any) {
            updateState({
                error: error.message || 'Failed to clear session',
            });
        }
    }, [state.session?.id, client, updateState]);

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Set up refresh timer
    useEffect(() => {
        if (refreshInterval > 0 && state.session?.id && state.isActive) {
            refreshTimerRef.current = setInterval(refreshSession, refreshInterval);
        } else if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [refreshInterval, state.session?.id, state.isActive, refreshSession]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, []);

    return {
        // State
        ...state,

        // Actions
        initialize,
        toggleSimulation,
        createSession,
        initiateCall,
        connectCall,
        endCall,
        failCall,
        dropCall,
        updateQuality,
        updateNetworkCondition,
        resetStats,
        clearSession,
        refreshSession,

        // Helpers
        formatDuration,
        getQualityColor,
        getNetworkColor,
        getCallStateLabel,
        calculateCallCost,
        getRemainingTime,
        isBalanceSufficient,
    };
}
