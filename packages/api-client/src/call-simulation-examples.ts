/**
 * Call Simulation API Examples
 * 
 * This file contains comprehensive examples demonstrating how to use the
 * Call Simulation API for testing audio and video calls.
 */

import {
    getCallSimulationClient,
    formatDuration,
    getQualityColor,
    getNetworkColor,
    getCallStateLabel,
    isCallActive,
    canEndCall,
    calculateCallCost,
    getRemainingTime,
    isBalanceSufficient,
    type CallSession,
    type CallQuality,
    type NetworkCondition,
} from '@foodiefinds/api-client';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wait for a specified duration
 */
function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log session information
 */
function logSession(session: CallSession): void {
    console.log('='.repeat(60));
    console.log('Session ID:', session.id);
    console.log('User ID:', session.userId);
    console.log('Creator ID:', session.creatorId);
    console.log('Call Type:', session.callType);
    console.log('State:', getCallStateLabel(session.state));
    console.log('Duration:', formatDuration(session.duration));
    console.log('Quality:', session.quality);
    console.log('Network:', session.networkCondition);
    console.log('Latency:', `${session.latency.toFixed(0)}ms`);
    console.log('Packet Loss:', `${session.packetLoss.toFixed(2)}%`);
    console.log('Bandwidth:', `${session.bandwidth.toFixed(0)}kbps`);
    console.log('='.repeat(60));
}

// ============================================================================
// EXAMPLE 1: BASIC AUDIO CALL
// ============================================================================

/**
 * Example 1: Basic Audio Call
 * Demonstrates creating a session, initiating a call, and ending it normally.
 */
export async function example1_BasicAudioCall() {
    console.log('\n=== Example 1: Basic Audio Call ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation
        await client.toggleSimulation(true);
        console.log('✓ Simulation enabled');

        // Create session
        const session = await client.createSession(
            'user_001',
            'creator_001',
            'audio',
            { scenario: 'basic_audio_call' }
        );
        console.log('✓ Session created:', session.id);

        // Initiate call
        await client.initiateCall(session.id);
        console.log('✓ Call initiated');

        // Wait for connection
        await wait(3000);

        // Check session status
        const connectedSession = await client.getSession(session.id);
        logSession(connectedSession);

        // Wait for some duration
        await wait(5000);

        // End call
        const endedSession = await client.endCall(session.id, 'user_ended');
        console.log('✓ Call ended');
        logSession(endedSession);

        // Clean up
        await client.deleteSession(session.id);
        console.log('✓ Session deleted');

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 2: VIDEO CALL WITH QUALITY CHANGES
// ============================================================================

/**
 * Example 2: Video Call with Quality Changes
 * Demonstrates simulating quality degradation and recovery during a call.
 */
export async function example2_VideoCallWithQualityChanges() {
    console.log('\n=== Example 2: Video Call with Quality Changes ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation
        await client.toggleSimulation(true);

        // Create video session
        const session = await client.createSession(
            'user_002',
            'creator_002',
            'video',
            { scenario: 'quality_changes' }
        );
        console.log('✓ Video session created');

        // Initiate call
        await client.initiateCall(session.id);
        console.log('✓ Call initiated');

        // Wait for connection
        await wait(3000);

        // Start with excellent quality
        await client.updateQuality(session.id, 'excellent');
        console.log('✓ Quality set to: excellent');
        await wait(5000);

        // Degrade to good
        await client.updateQuality(session.id, 'good');
        console.log('✓ Quality set to: good');
        await wait(5000);

        // Degrade to average
        await client.updateQuality(session.id, 'average');
        console.log('✓ Quality set to: average');
        await wait(5000);

        // Degrade to poor
        await client.updateQuality(session.id, 'poor');
        console.log('✓ Quality set to: poor');
        await wait(5000);

        // Recover to good
        await client.updateQuality(session.id, 'good');
        console.log('✓ Quality recovered to: good');
        await wait(5000);

        // End call
        await client.endCall(session.id, 'user_ended');
        console.log('✓ Call ended');

        // Clean up
        await client.deleteSession(session.id);

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 3: NETWORK CONDITION SIMULATION
// ============================================================================

/**
 * Example 3: Network Condition Simulation
 * Demonstrates simulating different network conditions and their effects.
 */
export async function example3_NetworkConditionSimulation() {
    console.log('\n=== Example 3: Network Condition Simulation ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation
        await client.toggleSimulation(true);

        // Create session
        const session = await client.createSession(
            'user_003',
            'creator_003',
            'video',
            { scenario: 'network_conditions' }
        );
        console.log('✓ Session created');

        // Initiate call
        await client.initiateCall(session.id);
        console.log('✓ Call initiated');

        // Wait for connection
        await wait(3000);

        // Test excellent network
        await client.updateNetworkCondition(session.id, 'excellent');
        console.log('✓ Network condition: excellent');
        let currentSession = await client.getSession(session.id);
        console.log(`  Latency: ${currentSession.latency.toFixed(0)}ms`);
        console.log(`  Packet Loss: ${currentSession.packetLoss.toFixed(2)}%`);
        console.log(`  Bandwidth: ${currentSession.bandwidth.toFixed(0)}kbps`);
        await wait(5000);

        // Test good network
        await client.updateNetworkCondition(session.id, 'good');
        console.log('✓ Network condition: good');
        currentSession = await client.getSession(session.id);
        console.log(`  Latency: ${currentSession.latency.toFixed(0)}ms`);
        console.log(`  Packet Loss: ${currentSession.packetLoss.toFixed(2)}%`);
        console.log(`  Bandwidth: ${currentSession.bandwidth.toFixed(0)}kbps`);
        await wait(5000);

        // Test average network
        await client.updateNetworkCondition(session.id, 'average');
        console.log('✓ Network condition: average');
        currentSession = await client.getSession(session.id);
        console.log(`  Latency: ${currentSession.latency.toFixed(0)}ms`);
        console.log(`  Packet Loss: ${currentSession.packetLoss.toFixed(2)}%`);
        console.log(`  Bandwidth: ${currentSession.bandwidth.toFixed(0)}kbps`);
        await wait(5000);

        // Test poor network
        await client.updateNetworkCondition(session.id, 'poor');
        console.log('✓ Network condition: poor');
        currentSession = await client.getSession(session.id);
        console.log(`  Latency: ${currentSession.latency.toFixed(0)}ms`);
        console.log(`  Packet Loss: ${currentSession.packetLoss.toFixed(2)}%`);
        console.log(`  Bandwidth: ${currentSession.bandwidth.toFixed(0)}kbps`);
        await wait(5000);

        // Test unstable network
        await client.updateNetworkCondition(session.id, 'unstable');
        console.log('✓ Network condition: unstable');
        currentSession = await client.getSession(session.id);
        console.log(`  Latency: ${currentSession.latency.toFixed(0)}ms`);
        console.log(`  Packet Loss: ${currentSession.packetLoss.toFixed(2)}%`);
        console.log(`  Bandwidth: ${currentSession.bandwidth.toFixed(0)}kbps`);
        await wait(5000);

        // End call
        await client.endCall(session.id, 'user_ended');
        console.log('✓ Call ended');

        // Clean up
        await client.deleteSession(session.id);

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 4: CALL DROP SIMULATION
// ============================================================================

/**
 * Example 4: Call Drop Simulation
 * Demonstrates simulating call drops due to network issues.
 */
export async function example4_CallDropSimulation() {
    console.log('\n=== Example 4: Call Drop Simulation ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation with high drop probability
        await client.toggleSimulation(true);
        await client.updateConfig({ dropProbability: 1.0 });
        console.log('✓ Simulation enabled with high drop probability');

        // Create session
        const session = await client.createSession(
            'user_004',
            'creator_004',
            'audio',
            { scenario: 'call_drop' }
        );
        console.log('✓ Session created');

        // Initiate call
        await client.initiateCall(session.id);
        console.log('✓ Call initiated');

        // Wait for connection
        await wait(3000);

        // Wait for drop (should happen within 10 seconds)
        console.log('⏳ Waiting for call drop...');
        await wait(15000);

        // Check session status
        const droppedSession = await client.getSession(session.id);
        console.log('✓ Call state:', getCallStateLabel(droppedSession.state));

        // Check for drop event
        const dropEvent = droppedSession.events.find(e => e.type === 'call-dropped');
        if (dropEvent) {
            console.log('✓ Call dropped:', dropEvent.data?.reason);
        }

        // Clean up
        await client.deleteSession(session.id);

        // Reset drop probability
        await client.updateConfig({ dropProbability: 0.05 });
        console.log('✓ Drop probability reset');

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 5: CONNECTION FAILURE SIMULATION
// ============================================================================

/**
 * Example 5: Connection Failure Simulation
 * Demonstrates simulating connection failures.
 */
export async function example5_ConnectionFailureSimulation() {
    console.log('\n=== Example 5: Connection Failure Simulation ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation with high failure probability
        await client.toggleSimulation(true);
        await client.updateConfig({ failureProbability: 1.0 });
        console.log('✓ Simulation enabled with high failure probability');

        // Create session
        const session = await client.createSession(
            'user_005',
            'creator_005',
            'video',
            { scenario: 'connection_failure' }
        );
        console.log('✓ Session created');

        // Initiate call (should fail)
        await client.initiateCall(session.id);
        console.log('✓ Call initiated');

        // Wait for failure
        await wait(3000);

        // Check session status
        const failedSession = await client.getSession(session.id);
        console.log('✓ Call state:', getCallStateLabel(failedSession.state));

        // Check for failure event
        const failEvent = failedSession.events.find(e => e.type === 'call-failed');
        if (failEvent) {
            console.log('✓ Call failed:', failEvent.data?.reason);
        }

        // Clean up
        await client.deleteSession(session.id);

        // Reset failure probability
        await client.updateConfig({ failureProbability: 0.02 });
        console.log('✓ Failure probability reset');

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 6: BALANCE INTEGRATION
// ============================================================================

/**
 * Example 6: Balance Integration
 * Demonstrates integrating call simulation with balance monitoring.
 */
export async function example6_BalanceIntegration() {
    console.log('\n=== Example 6: Balance Integration ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation with balance checking
        await client.toggleSimulation(true);
        await client.updateConfig({
            enableBalanceCheck: true,
            minBalance: 10,
            pricePerMinute: 5,
        });
        console.log('✓ Simulation enabled with balance checking');

        // Create session
        const session = await client.createSession(
            'user_006',
            'creator_006',
            'audio',
            { scenario: 'balance_integration' }
        );
        console.log('✓ Session created');

        // Initiate call
        await client.initiateCall(session.id);
        console.log('✓ Call initiated');

        // Wait for connection
        await wait(3000);

        // Simulate balance monitoring
        const balance = 50; // User has ₹50
        const pricePerMinute = 5;

        console.log(`\n💰 User Balance: ₹${balance}`);
        console.log(`💰 Price per minute: ₹${pricePerMinute}`);

        // Monitor balance during call
        const monitorInterval = setInterval(async () => {
            const currentSession = await client.getSession(session.id);
            const cost = calculateCallCost(currentSession.duration, pricePerMinute);
            const remainingTime = getRemainingTime(balance - cost, pricePerMinute);

            console.log(`\n⏱️  Duration: ${formatDuration(currentSession.duration)}`);
            console.log(`💰 Current cost: ₹${cost.toFixed(2)}`);
            console.log(`💰 Remaining balance: ₹${(balance - cost).toFixed(2)}`);
            console.log(`⏱️  Remaining time: ${formatDuration(remainingTime)}`);

            // Check if balance is sufficient
            if (!isBalanceSufficient(balance - cost, pricePerMinute, 1)) {
                console.log('\n⚠️  Balance insufficient! Ending call...');
                clearInterval(monitorInterval);
                await client.endCall(session.id, 'insufficient_balance');
            }
        }, 5000);

        // Wait for call to end
        await wait(30000);

        // Clean up
        clearInterval(monitorInterval);
        await client.deleteSession(session.id);

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 7: MULTIPLE CONCURRENT CALLS
// ============================================================================

/**
 * Example 7: Multiple Concurrent Calls
 * Demonstrates managing multiple concurrent call sessions.
 */
export async function example7_MultipleConcurrentCalls() {
    console.log('\n=== Example 7: Multiple Concurrent Calls ===\n');

    const client = getCallSimulationClient();

    try {
        // Enable simulation
        await client.toggleSimulation(true);
        console.log('✓ Simulation enabled');

        // Create multiple sessions
        const sessions: CallSession[] = [];
        for (let i = 1; i <= 3; i++) {
            const session = await client.createSession(
                `user_00${i}`,
                `creator_00${i}`,
                i % 2 === 0 ? 'video' : 'audio',
                { scenario: 'concurrent_calls', index: i }
            );
            sessions.push(session);
            console.log(`✓ Session ${i} created: ${session.id}`);
        }

        // Initiate all calls
        for (const session of sessions) {
            await client.initiateCall(session.id);
            console.log(`✓ Call initiated for session: ${session.id}`);
        }

        // Wait for connections
        await wait(5000);

        // Check all active sessions
        const activeSessions = await client.getActiveSessions();
        console.log(`\n✓ Active sessions: ${activeSessions.length}`);
        activeSessions.forEach((session, index) => {
            console.log(`  ${index + 1}. ${session.id} - ${getCallStateLabel(session.state)}`);
        });

        // Wait for some duration
        await wait(10000);

        // End all calls
        for (const session of sessions) {
            await client.endCall(session.id, 'user_ended');
            console.log(`✓ Call ended for session: ${session.id}`);
        }

        // Clean up all sessions
        for (const session of sessions) {
            await client.deleteSession(session.id);
        }
        console.log('✓ All sessions deleted');

        // Get statistics
        const stats = await client.getStats();
        console.log('\n📊 Statistics:');
        console.log(`  Total calls: ${stats.totalCalls}`);
        console.log(`  Successful calls: ${stats.successfulCalls}`);
        console.log(`  Average duration: ${formatDuration(stats.averageDuration)}`);

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// EXAMPLE 8: AUTOMATED TEST SCENARIO
// ============================================================================

/**
 * Example 8: Automated Test Scenario
 * Demonstrates a comprehensive automated test scenario.
 */
export async function example8_AutomatedTestScenario() {
    console.log('\n=== Example 8: Automated Test Scenario ===\n');

    const client = getCallSimulationClient();

    try {
        // Reset statistics
        await client.resetStats();
        console.log('✓ Statistics reset');

        // Enable simulation
        await client.toggleSimulation(true);
        console.log('✓ Simulation enabled');

        // Test scenarios
        const scenarios = [
            { name: 'Audio Call', type: 'audio' as const },
            { name: 'Video Call', type: 'video' as const },
            { name: 'Audio Call with Poor Quality', type: 'audio' as const, quality: 'poor' as CallQuality },
            { name: 'Video Call with Unstable Network', type: 'video' as const, network: 'unstable' as NetworkCondition },
        ];

        const results: any[] = [];

        for (const scenario of scenarios) {
            console.log(`\n🧪 Testing: ${scenario.name}`);

            try {
                // Create session
                const session = await client.createSession(
                    `test_user`,
                    `test_creator`,
                    scenario.type,
                    { scenario: scenario.name }
                );

                // Initiate call
                await client.initiateCall(session.id);
                await wait(3000);

                // Apply scenario-specific settings
                if (scenario.quality) {
                    await client.updateQuality(session.id, scenario.quality);
                }
                if (scenario.network) {
                    await client.updateNetworkCondition(session.id, scenario.network);
                }

                // Wait for duration
                await wait(5000);

                // End call
                const endedSession = await client.endCall(session.id, 'test_complete');

                // Record result
                results.push({
                    scenario: scenario.name,
                    success: true,
                    duration: endedSession.duration,
                    quality: endedSession.quality,
                    network: endedSession.networkCondition,
                });

                console.log(`✓ ${scenario.name} completed successfully`);

                // Clean up
                await client.deleteSession(session.id);

            } catch (error) {
                results.push({
                    scenario: scenario.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                console.log(`✗ ${scenario.name} failed:`, error);
            }
        }

        // Print summary
        console.log('\n📊 Test Summary:');
        console.log('='.repeat(60));
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.scenario}`);
            console.log(`   Status: ${result.success ? '✓ PASS' : '✗ FAIL'}`);
            if (result.success) {
                console.log(`   Duration: ${formatDuration(result.duration)}`);
                console.log(`   Quality: ${result.quality}`);
                console.log(`   Network: ${result.network}`);
            } else {
                console.log(`   Error: ${result.error}`);
            }
        });

        // Get final statistics
        const stats = await client.getStats();
        console.log('\n📊 Final Statistics:');
        console.log(`  Total calls: ${stats.totalCalls}`);
        console.log(`  Successful calls: ${stats.successfulCalls}`);
        console.log(`  Failed calls: ${stats.failedCalls}`);
        console.log(`  Dropped calls: ${stats.droppedCalls}`);
        console.log(`  Average duration: ${formatDuration(stats.averageDuration)}`);

    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

/**
 * Run all examples sequentially
 */
export async function runAllExamples() {
    console.log('\n🚀 Running All Call Simulation Examples\n');

    try {
        await example1_BasicAudioCall();
        await wait(1000);

        await example2_VideoCallWithQualityChanges();
        await wait(1000);

        await example3_NetworkConditionSimulation();
        await wait(1000);

        await example4_CallDropSimulation();
        await wait(1000);

        await example5_ConnectionFailureSimulation();
        await wait(1000);

        await example6_BalanceIntegration();
        await wait(1000);

        await example7_MultipleConcurrentCalls();
        await wait(1000);

        await example8_AutomatedTestScenario();

        console.log('\n✅ All examples completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Error running examples:', error);
    }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
    example1_BasicAudioCall,
    example2_VideoCallWithQualityChanges,
    example3_NetworkConditionSimulation,
    example4_CallDropSimulation,
    example5_ConnectionFailureSimulation,
    example6_BalanceIntegration,
    example7_MultipleConcurrentCalls,
    example8_AutomatedTestScenario,
    runAllExamples,
};
