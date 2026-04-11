# Call Simulation API - Quick Start Guide

## Overview

The Call Simulation API provides a comprehensive testing framework for simulating audio and video calls without requiring actual WebRTC media streams. This API is designed for testing purposes and can be easily toggled on/off for development vs production environments.

## Quick Start

### 1. Enable Simulation

Set the environment variable to enable simulation on server start:

```bash
export ENABLE_CALL_SIMULATION=true
```

Or enable it programmatically:

```typescript
import { getCallSimulationClient } from '@foodiefinds/api-client';

const client = getCallSimulationClient();
await client.toggleSimulation(true);
```

### 2. Create a Session

```typescript
const session = await client.createSession(
  'user_123',
  'creator_456',
  'video'
);
```

### 3. Initiate a Call

```typescript
await client.initiateCall(session.id);
```

### 4. Monitor the Call

```typescript
// Get current session state
const currentSession = await client.getSession(session.id);
console.log('State:', currentSession.state);
console.log('Duration:', currentSession.duration);
console.log('Quality:', currentSession.quality);
```

### 5. End the Call

```typescript
await client.endCall(session.id, 'user_ended');
```

## File Structure

```
FoodieFinds/
├── server/
│   ├── call-simulation.ts          # Core simulation engine
│   └── routes.ts                  # API endpoints (includes simulation routes)
├── packages/
│   └── api-client/
│       ├── call-simulation-client.ts    # HTTP client
│       └── call-simulation-examples.ts # Usage examples
├── client/
│   └── hooks/
│       └── useCallSimulation.ts    # React hook
├── CALL-SIMULATION-API.md         # Full API documentation
└── CALL-SIMULATION-README.md      # This file
```

## Key Features

### ✅ Audio & Video Call Simulation
- Simulate both audio and video calls with realistic behavior
- No actual media streams required

### ✅ Call State Management
- Track call states: idle, initiating, connecting, connected, disconnected, failed
- Real-time state updates

### ✅ Call Duration Tracking
- Real-time duration tracking
- Configurable maximum duration limits

### ✅ Call Quality Simulation
- Five quality levels: excellent, good, average, poor, terrible
- Dynamic quality changes during calls

### ✅ Network Condition Simulation
- Five network conditions: excellent, good, average, poor, unstable
- Realistic latency, packet loss, and bandwidth metrics

### ✅ Error Scenario Simulation
- Call drops with configurable probability
- Connection failures with configurable probability
- Various error reasons

### ✅ Balance Integration
- Integrate with wallet and balance monitoring system
- Automatic call termination on balance exhaustion

### ✅ Event Tracking
- Comprehensive event logging
- Detailed call history

## API Endpoints

### Simulation Control
- `GET /api/simulation/status` - Get simulation status
- `POST /api/simulation/toggle` - Toggle simulation on/off
- `GET /api/simulation/config` - Get configuration
- `PATCH /api/simulation/config` - Update configuration

### Session Management
- `POST /api/simulation/session` - Create session
- `GET /api/simulation/session/:id` - Get session
- `GET /api/simulation/sessions/active` - Get active sessions
- `GET /api/simulation/sessions` - Get all sessions
- `DELETE /api/simulation/session/:id` - Delete session

### Call Control
- `POST /api/simulation/call/initiate` - Initiate call
- `POST /api/simulation/call/connect` - Connect call
- `POST /api/simulation/call/end` - End call
- `POST /api/simulation/call/fail` - Fail call
- `POST /api/simulation/call/drop` - Drop call

### Quality & Network
- `PATCH /api/simulation/call/:id/quality` - Update quality
- `PATCH /api/simulation/call/:id/network` - Update network condition

### Statistics
- `GET /api/simulation/stats` - Get statistics
- `POST /api/simulation/stats/reset` - Reset statistics
- `DELETE /api/simulation/sessions` - Clear all sessions

## Usage Examples

### Basic Audio Call

```typescript
import { getCallSimulationClient } from '@foodiefinds/api-client';

const client = getCallSimulationClient();

// Enable simulation
await client.toggleSimulation(true);

// Create session
const session = await client.createSession('user_123', 'creator_456', 'audio');

// Initiate call
await client.initiateCall(session.id);

// Wait for connection
await new Promise(resolve => setTimeout(resolve, 3000));

// End call
await client.endCall(session.id, 'user_ended');
```

### Video Call with Quality Changes

```typescript
const session = await client.createSession('user_123', 'creator_456', 'video');
await client.initiateCall(session.id);

// Change quality during call
await client.updateQuality(session.id, 'excellent');
await new Promise(resolve => setTimeout(resolve, 5000));

await client.updateQuality(session.id, 'poor');
await new Promise(resolve => setTimeout(resolve, 5000));

await client.endCall(session.id, 'user_ended');
```

### Using React Hook

```typescript
import { useCallSimulation } from '@/hooks/useCallSimulation';

function MyComponent() {
  const {
    session,
    callState,
    duration,
    quality,
    isActive,
    canEnd,
    createSession,
    initiateCall,
    endCall,
  } = useCallSimulation({
    refreshInterval: 1000,
    enableNotifications: true,
  });

  const handleStartCall = async () => {
    const session = await createSession('user_123', 'creator_456', 'video');
    await initiateCall();
  };

  return (
    <div>
      <p>State: {callState}</p>
      <p>Duration: {duration}s</p>
      <p>Quality: {quality}</p>
      {isActive && canEnd && (
        <button onClick={() => endCall('user_ended')}>End Call</button>
      )}
    </div>
  );
}
```

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

## Testing Scenarios

### Scenario 1: Basic Audio Call
Create, initiate, and end a simple audio call.

### Scenario 2: Video Call with Quality Changes
Simulate quality degradation and recovery during a video call.

### Scenario 3: Network Condition Simulation
Test different network conditions and their effects.

### Scenario 4: Call Drop Simulation
Simulate call drops due to network issues.

### Scenario 5: Connection Failure Simulation
Test connection failure scenarios.

### Scenario 6: Balance Integration
Integrate with wallet and balance monitoring system.

### Scenario 7: Multiple Concurrent Calls
Manage multiple concurrent call sessions.

### Scenario 8: Automated Test Scenario
Comprehensive automated test suite.

See [`call-simulation-examples.ts`](../packages/api-client/src/call-simulation-examples.ts) for complete examples.

## Integration with Existing Components

The simulation API works seamlessly with the existing [`CallInterface`](../packages/ui-components/src/components/CallInterface.tsx) component:

```typescript
import { useCallSimulation } from '@/hooks/useCallSimulation';
import { CallInterface } from '@foodiefinds/ui-components';

function MyCallPage() {
  const { createSession, initiateCall, endCall } = useCallSimulation();

  const handleStartCall = async () => {
    await createSession('user_123', 'creator_456', 'video');
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

## Troubleshooting

### Simulation Not Working

```typescript
// Check if simulation is enabled
const status = await client.getStatus();
console.log('Enabled:', status.enabled);

// Enable simulation
await client.toggleSimulation(true);
```

### Call Not Connecting

```typescript
// Check session state
const session = await client.getSession(sessionId);
console.log('State:', session.state);

// Check for errors
const errorEvent = session.events.find(e => e.type === 'call-failed');
console.log('Error:', errorEvent?.data?.reason);
```

### Quality Not Updating

```typescript
// Verify quality update
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

## Documentation

- [Full API Documentation](./CALL-SIMULATION-API.md) - Complete API reference
- [Usage Examples](../packages/api-client/src/call-simulation-examples.ts) - Code examples

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

## License

This API is part of the FoodieFinds application.
