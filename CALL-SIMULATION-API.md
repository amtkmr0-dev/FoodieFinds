# Call Simulation API Documentation

## Overview

The Call Simulation API provides a comprehensive testing framework for simulating audio and video calls without requiring actual WebRTC media streams. This API is designed for testing purposes and can be easily toggled on/off for development vs production environments.

## Features

- **Audio & Video Call Simulation**: Simulate both audio and video calls with realistic behavior
- **Call State Management**: Track call states (idle, initiating, connecting, connected, disconnected, failed)
- **Call Duration Tracking**: Real-time duration tracking with configurable limits
- **Call Quality Simulation**: Simulate different quality levels (excellent, good, average, poor, terrible)
- **Network Condition Simulation**: Simulate various network conditions with latency, packet loss, and bandwidth metrics
- **Error Scenario Simulation**: Test call drops, connection failures, and other error conditions
- **Balance Integration**: Integrate with wallet and balance monitoring system
- **Event Tracking**: Comprehensive event logging for debugging and analysis

## Architecture

### Server-Side Components

- **`server/call-simulation.ts`**: Core simulation engine with `CallSimulator` class
- **`server/routes.ts`**: REST API endpoints for simulation control

### Client-Side Components

- **`packages/api-client/src/call-simulation-client.ts`**: HTTP client for API interaction
- **`client/src/hooks/useCallSimulation.ts`**: React hook for state management

## API Endpoints

### Simulation Control

#### GET `/api/simulation/status`
Get current simulation status.

**Response:**
```json
{
  "enabled": true,
  "activeSessions": 2,
  "totalSessions": 15,
  "stats": {
    "totalCalls": 15,
    "successfulCalls": 12,
    "failedCalls": 2,
    "droppedCalls": 1,
    "averageDuration": 180,
    "averageQuality": 3.5,
    "totalDuration": 2700
  }
}
```

#### POST `/api/simulation/toggle`
Enable or disable simulation mode.

**Request:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "enabled": true
}
```

#### GET `/api/simulation/config`
Get current simulation configuration.

**Response:**
```json
{
  "enabled": true,
  "defaultCallType": "audio",
  "connectionDelay": 2000,
  "maxDuration": 0,
  "quality": "good",
  "networkCondition": "good",
  "dropProbability": 0.05,
  "failureProbability": 0.02,
  "enableBalanceCheck": true,
  "minBalance": 10,
  "pricePerMinute": 5
}
```

#### PATCH `/api/simulation/config`
Update simulation configuration.

**Request:**
```json
{
  "quality": "excellent",
  "networkCondition": "excellent",
  "dropProbability": 0.01
}
```

### Session Management

#### POST `/api/simulation/session`
Create a new call session.

**Request:**
```json
{
  "userId": "user_123",
  "creatorId": "creator_456",
  "callType": "video",
  "metadata": {
    "testScenario": "video_call_test"
  }
}
```

**Response:**
```json
{
  "id": "sim_1234567890_abc123",
  "userId": "user_123",
  "creatorId": "creator_456",
  "callType": "video",
  "state": "idle",
  "startTime": 1234567890000,
  "duration": 0,
  "quality": "good",
  "networkCondition": "good",
  "latency": 50,
  "packetLoss": 0.1,
  "bandwidth": 2500,
  "events": [...],
  "metadata": {...}
}
```

#### GET `/api/simulation/session/:sessionId`
Get a specific session by ID.

#### GET `/api/simulation/sessions/active`
Get all active sessions.

#### GET `/api/simulation/sessions`
Get all sessions.

#### DELETE `/api/simulation/session/:sessionId`
Delete a session.

### Call Control

#### POST `/api/simulation/call/initiate`
Initiate a call.

**Request:**
```json
{
  "sessionId": "sim_1234567890_abc123"
}
```

#### POST `/api/simulation/call/connect`
Connect a call.

**Request:**
```json
{
  "sessionId": "sim_1234567890_abc123"
}
```

#### POST `/api/simulation/call/end`
End a call.

**Request:**
```json
{
  "sessionId": "sim_1234567890_abc123",
  "reason": "user_ended"
}
```

#### POST `/api/simulation/call/fail`
Fail a call (for testing error scenarios).

**Request:**
```json
{
  "sessionId": "sim_1234567890_abc123",
  "reason": "connection_failed"
}
```

#### POST `/api/simulation/call/drop`
Drop a call (simulate network issues).

**Request:**
```json
{
  "sessionId": "sim_1234567890_abc123",
  "reason": "network_drop"
}
```

### Quality & Network

#### PATCH `/api/simulation/call/:sessionId/quality`
Update call quality.

**Request:**
```json
{
  "quality": "poor"
}
```

#### PATCH `/api/simulation/call/:sessionId/network`
Update network condition.

**Request:**
```json
{
  "condition": "poor"
}
```

### Statistics

#### GET `/api/simulation/stats`
Get simulation statistics.

**Response:**
```json
{
  "totalCalls": 15,
  "successfulCalls": 12,
  "failedCalls": 2,
  "droppedCalls": 1,
  "averageDuration": 180,
  "averageQuality": 3.5,
  "totalDuration": 2700
}
```

#### POST `/api/simulation/stats/reset`
Reset simulation statistics.

#### DELETE `/api/simulation/sessions`
Clear all sessions.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable or disable simulation mode |
| `defaultCallType` | 'audio' \| 'video' | 'audio' | Default call type |
| `connectionDelay` | number | 2000 | Connection delay in milliseconds |
| `maxDuration` | number | 0 | Maximum call duration in seconds (0 = unlimited) |
| `quality` | CallQuality | 'good' | Default call quality |
| `networkCondition` | NetworkCondition | 'good' | Default network condition |
| `dropProbability` | number | 0.05 | Probability of call drop (0-1) |
| `failureProbability` | number | 0.02 | Probability of connection failure (0-1) |
| `enableBalanceCheck` | boolean | true | Enable balance checking |
| `minBalance` | number | 10 | Minimum balance required |
| `pricePerMinute` | number | 5 | Price per minute |

## Call States

| State | Description |
|-------|-------------|
| `idle` | Session created, call not initiated |
| `initiating` | Call initiation in progress |
| `connecting` | Connection establishment in progress |
| `connected` | Call is active and connected |
| `disconnected` | Call ended normally |
| `failed` | Call failed due to error |

## Call Quality Levels

| Quality | Description |
|---------|-------------|
| `excellent` | Perfect call quality |
| `good` | Good call quality with minor issues |
| `average` | Acceptable quality with noticeable issues |
| `poor` | Poor quality with significant issues |
| `terrible` | Very poor quality, barely usable |

## Network Conditions

| Condition | Latency (ms) | Packet Loss (%) | Bandwidth (kbps) |
|-----------|--------------|----------------|------------------|
| `excellent` | 20-30 | 0-0.1 | 5000-6500 |
| `good` | 50-75 | 0.1-0.15 | 2500-3250 |
| `average` | 100-150 | 0.5-0.75 | 1000-1300 |
| `poor` | 200-300 | 2-3 | 500-650 |
| `unstable` | 300-450 | 5-7.5 | 250-325 |

## Usage Examples

### Server-Side Usage

```typescript
import { getCallSimulator } from './call-simulation';

// Get simulator instance
const simulator = getCallSimulator({
  enabled: true,
  quality: 'good',
  networkCondition: 'good',
});

// Create a session
const session = await simulator.createSession(
  'user_123',
  'creator_456',
  'video'
);

// Initiate call
await simulator.initiateCall(session.id);

// Update quality
simulator.updateQuality(session.id, 'excellent');

// End call
await simulator.endCall(session.id, 'user_ended');
```

### Client-Side Usage (HTTP Client)

```typescript
import { getCallSimulationClient } from '@foodiefinds/api-client';

const client = getCallSimulationClient();

// Check if simulation is enabled
const status = await client.getStatus();
console.log('Simulation enabled:', status.enabled);

// Create a session
const session = await client.createSession(
  'user_123',
  'creator_456',
  'video'
);

// Initiate call
await client.initiateCall(session.id);

// End call
await client.endCall(session.id, 'user_ended');
```

### Client-Side Usage (React Hook)

```typescript
import { useCallSimulation } from '@/hooks/useCallSimulation';

function MyComponent() {
  const {
    session,
    enabled,
    callState,
    duration,
    quality,
    isActive,
    canEnd,
    createSession,
    initiateCall,
    endCall,
    updateQuality,
  } = useCallSimulation({
    refreshInterval: 1000,
    enableNotifications: true,
    onCallEnd: (session) => {
      console.log('Call ended:', session);
    },
  });

  const handleStartCall = async () => {
    const session = await createSession('user_123', 'creator_456', 'video');
    await initiateCall();
  };

  const handleEndCall = async () => {
    await endCall('user_ended');
  };

  return (
    <div>
      <p>Call State: {callState}</p>
      <p>Duration: {duration}s</p>
      <p>Quality: {quality}</p>
      {isActive && canEnd && (
        <button onClick={handleEndCall}>End Call</button>
      )}
    </div>
  );
}
```

## Testing Scenarios

### Scenario 1: Basic Audio Call

```typescript
// 1. Enable simulation
await client.toggleSimulation(true);

// 2. Create session
const session = await client.createSession('user_123', 'creator_456', 'audio');

// 3. Initiate call
await client.initiateCall(session.id);

// 4. Wait for connection
await new Promise(resolve => setTimeout(resolve, 3000));

// 5. End call
await client.endCall(session.id, 'user_ended');
```

### Scenario 2: Video Call with Quality Changes

```typescript
const session = await client.createSession('user_123', 'creator_456', 'video');
await client.initiateCall(session.id);

// Simulate quality degradation
await new Promise(resolve => setTimeout(resolve, 5000));
await client.updateQuality(session.id, 'average');

// Further degradation
await new Promise(resolve => setTimeout(resolve, 5000));
await client.updateQuality(session.id, 'poor');

// Recovery
await new Promise(resolve => setTimeout(resolve, 5000));
await client.updateQuality(session.id, 'good');

await client.endCall(session.id, 'user_ended');
```

### Scenario 3: Network Issues

```typescript
const session = await client.createSession('user_123', 'creator_456', 'video');
await client.initiateCall(session.id);

// Simulate poor network
await client.updateNetworkCondition(session.id, 'poor');

// Wait for potential drop
await new Promise(resolve => setTimeout(resolve, 15000));

// Check if still connected
const updatedSession = await client.getSession(session.id);
console.log('Call state:', updatedSession.state);
```

### Scenario 4: Connection Failure

```typescript
// Set high failure probability
await client.updateConfig({ failureProbability: 1.0 });

const session = await client.createSession('user_123', 'creator_456', 'audio');
await client.initiateCall(session.id);

// Check result
const updatedSession = await client.getSession(session.id);
console.log('Call state:', updatedSession.state); // Should be 'failed'
```

### Scenario 5: Balance Integration

```typescript
// Set balance requirements
await client.updateConfig({
  enableBalanceCheck: true,
  minBalance: 10,
  pricePerMinute: 5,
});

const session = await client.createSession('user_123', 'creator_456', 'audio');
await client.initiateCall(session.id);

// Monitor balance during call
const checkBalance = async () => {
  const updatedSession = await client.getSession(session.id);
  const cost = calculateCallCost(updatedSession.duration, 5);
  console.log('Current cost:', cost);
};

setInterval(checkBalance, 5000);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_CALL_SIMULATION` | Enable call simulation on server start | `false` |

## Production Deployment

To disable simulation in production:

1. Set environment variable:
   ```bash
   export ENABLE_CALL_SIMULATION=false
   ```

2. Or update configuration:
   ```typescript
   await client.toggleSimulation(false);
   ```

## Integration with CallInterface Component

The simulation API is designed to work seamlessly with the existing [`CallInterface`](../packages/ui-components/src/components/CallInterface.tsx) component. To use simulation mode:

```typescript
import { useCallSimulation } from '@/hooks/useCallSimulation';
import { CallInterface } from '@foodiefinds/ui-components';

function MyCallPage() {
  const { session, createSession, initiateCall, endCall } = useCallSimulation();

  const handleStartCall = async () => {
    const simSession = await createSession('user_123', 'creator_456', 'video');
    await initiateCall();
  };

  return (
    <CallInterface
      creatorName="John Doe"
      creatorId="creator_456"
      pricePerMinute={5}
      callType="video"
      onEndCall={async () => {
        await endCall('user_ended');
      }}
    />
  );
}
```

## Troubleshooting

### Simulation Not Working

1. Check if simulation is enabled:
   ```typescript
   const status = await client.getStatus();
   console.log('Enabled:', status.enabled);
   ```

2. Enable simulation:
   ```typescript
   await client.toggleSimulation(true);
   ```

### Call Not Connecting

1. Check session state:
   ```typescript
   const session = await client.getSession(sessionId);
   console.log('State:', session.state);
   ```

2. Check for errors in session events:
   ```typescript
   const errorEvent = session.events.find(e => e.type === 'call-failed');
   console.log('Error:', errorEvent?.data?.reason);
   ```

### Quality Not Updating

1. Verify quality update:
   ```typescript
   await client.updateQuality(sessionId, 'excellent');
   const session = await client.getSession(sessionId);
   console.log('Quality:', session.quality);
   ```

## Best Practices

1. **Always disable simulation in production**: Use environment variables to control simulation mode
2. **Clean up sessions**: Delete sessions after testing to prevent memory leaks
3. **Reset statistics**: Reset stats between test runs for accurate results
4. **Use realistic configurations**: Test with various quality and network conditions
5. **Monitor events**: Use session events for debugging and analysis
6. **Test error scenarios**: Include failure and drop scenarios in test suites

## License

This API is part of the FoodieFinds application.
