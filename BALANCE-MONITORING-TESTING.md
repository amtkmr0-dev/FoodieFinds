# Balance Monitoring and Call Disconnection - Testing Guide

## Overview
This document provides comprehensive testing guidelines for the low balance notification and call disconnection functionality implemented in the FoodieFinds application.

## Implementation Summary

### Components Created
1. **`useCallBalanceMonitor` Hook** ([`../client/src/hooks/useCallBalanceMonitor.ts`](../client/src/hooks/useCallBalanceMonitor.ts))
   - Real-time wallet balance polling during calls
   - Configurable warning and critical thresholds
   - Automatic call disconnection when balance reaches zero or negative
   - Toast notifications for low balance scenarios

2. **`BalanceMonitor` Component** ([`../client/src/components/BalanceMonitor.tsx`](../client/src/components/BalanceMonitor.tsx))
   - Visual display of live balance, remaining time, and cost breakdown
   - Color-coded warnings (normal, warning, critical)
   - Compact and full display modes
   - Responsive design for mobile and desktop

3. **Updated `CallInterface` Component** ([`../client/src/components/CallInterface.tsx`](../client/src/components/CallInterface.tsx))
   - Integrated balance monitoring hook
   - Enhanced UI with balance warnings
   - Automatic call termination on insufficient balance
   - Improved recharge button with urgency indicators

## Configuration

### Default Thresholds
- **Warning Threshold**: ₹50 (user gets notified when balance drops below this)
- **Critical Threshold**: ₹20 (urgent notification displayed)
- **Call Ending Soon**: 20 seconds remaining
- **Polling Interval**: 2 seconds (configurable)

### Configurable Options
```typescript
{
  warningThreshold?: number;      // Default: 50
  criticalThreshold?: number;     // Default: 20
  pollInterval?: number;          // Default: 2000ms
  autoDisconnect?: boolean;        // Default: true
  onDisconnect?: (reason) => void; // Callback for disconnection
}
```

## Testing Scenarios

### 1. Normal Call Flow (Sufficient Balance)

**Setup:**
- User balance: ₹500
- Call rate: ₹10/minute
- Expected call duration: 5 minutes

**Expected Behavior:**
- ✅ Call starts normally
- ✅ Balance display shows live balance decreasing
- ✅ No warnings displayed
- ✅ Countdown timer shows remaining time
- ✅ Call can be ended manually by user
- ✅ Cost breakdown displayed correctly

**Test Steps:**
1. Start a call with sufficient balance
2. Monitor balance display updates every 2 seconds
3. Verify live balance calculation: `balance - (callCost + giftCost)`
4. Verify remaining time calculation: `floor((balance - giftCost) / pricePerMinute * 60)`
5. End call manually and verify cost deduction

---

### 2. Low Balance Warning (Warning Threshold)

**Setup:**
- User balance: ₹60
- Call rate: ₹10/minute
- Call duration: 1 minute (cost: ₹10)
- Live balance after 1 min: ₹50

**Expected Behavior:**
- ✅ Warning toast notification appears when balance drops below ₹50
- ✅ Warning notification shown only once per call
- ✅ Balance display shows yellow/warning color
- ✅ "Low Balance" alert displayed in BalanceMonitor
- ✅ Call continues normally
- ✅ Recharge button shows normal state

**Test Steps:**
1. Start call with balance near warning threshold
2. Wait for balance to drop below ₹50
3. Verify warning toast appears
4. Verify warning alert in BalanceMonitor
5. Continue call and verify no duplicate warnings
6. End call manually

---

### 3. Critical Balance Warning (Critical Threshold)

**Setup:**
- User balance: ₹30
- Call rate: ₹10/minute
- Call duration: 1 minute (cost: ₹10)
- Live balance after 1 min: ₹20

**Expected Behavior:**
- ✅ Critical toast notification appears when balance drops below ₹20
- ✅ Critical notification shown only once per call
- ✅ Balance display shows red/critical color
- ✅ "Critical Balance" alert displayed in BalanceMonitor
- ✅ Recharge button shows pulsing animation
- ✅ Call continues until balance reaches zero

**Test Steps:**
1. Start call with balance near critical threshold
2. Wait for balance to drop below ₹20
3. Verify critical toast appears
4. Verify critical alert in BalanceMonitor
5. Verify recharge button has pulsing animation
6. Continue call and verify no duplicate critical warnings

---

### 4. Call Ending Soon (20 Seconds Remaining)

**Setup:**
- User balance: ₹25
- Call rate: ₹10/minute
- Expected remaining time: ~150 seconds
- Wait until 20 seconds remaining

**Expected Behavior:**
- ✅ "Call Ending Soon" alert displayed with countdown
- ✅ Alert shows pulsing animation
- ✅ Recharge button shows "Recharge Now!" text
- ✅ Recharge button has red ring and pulsing animation
- ✅ Countdown timer updates every second
- ✅ Call continues until balance reaches zero

**Test Steps:**
1. Start call with limited balance
2. Monitor remaining time countdown
3. When remaining time reaches 20 seconds:
   - Verify "Call Ending Soon" alert appears
   - Verify alert shows pulsing animation
   - Verify recharge button text changes to "Recharge Now!"
4. Continue monitoring until call ends

---

### 5. Automatic Call Disconnection (Balance Reaches Zero)

**Setup:**
- User balance: ₹15
- Call rate: ₹10/minute
- Expected call duration: 1.5 minutes

**Expected Behavior:**
- ✅ Call automatically ends when live balance reaches ₹0
- ✅ Toast notification: "Call Ended - Insufficient balance to continue the call"
- ✅ Call cost is properly deducted
- ✅ User is returned to previous screen
- ✅ No negative balance occurs

**Test Steps:**
1. Start call with limited balance
2. Monitor balance decreasing
3. When live balance reaches ₹0:
   - Verify call ends automatically
   - Verify toast notification appears
   - Verify user is navigated away from call screen
4. Check wallet balance - should not be negative

---

### 6. Automatic Call Disconnection (Negative Balance Prevention)

**Setup:**
- User balance: ₹5
- Call rate: ₹10/minute
- Simulate rapid balance depletion

**Expected Behavior:**
- ✅ Call ends before balance goes negative
- ✅ Toast notification: "Call Ended - Your balance has been exhausted"
- ✅ Live balance never shows negative value
- ✅ Call cost is capped at available balance
- ✅ No partial minute charging beyond available balance

**Test Steps:**
1. Start call with very low balance
2. Monitor balance closely
3. Verify call ends before balance goes negative
4. Verify toast notification mentions "exhausted"
5. Check wallet balance - should be exactly ₹0

---

### 7. Gift Sending During Call

**Setup:**
- User balance: ₹100
- Call rate: ₹10/minute
- Send gift worth ₹30 during call

**Expected Behavior:**
- ✅ Gift cost is immediately deducted from live balance
- ✅ Remaining time recalculated after gift
- ✅ Cost breakdown shows both call and gift costs
- ✅ Balance monitor updates in real-time
- ✅ If gift causes low balance, appropriate warning shown

**Test Steps:**
1. Start call with sufficient balance
2. Note initial remaining time
3. Send a gift during call
4. Verify:
   - Gift toast appears
   - Live balance decreases by gift amount
   - Remaining time recalculated
   - Cost breakdown updated
5. If gift causes low balance, verify warning appears

---

### 8. Multiple Gifts During Call

**Setup:**
- User balance: ₹200
- Call rate: ₹10/minute
- Send multiple gifts totaling ₹150

**Expected Behavior:**
- ✅ Each gift cost is added to total gift cost
- ✅ Live balance decreases with each gift
- ✅ Remaining time recalculated after each gift
- ✅ Warnings triggered appropriately based on cumulative costs
- ✅ Call may end if gifts exhaust balance

**Test Steps:**
1. Start call with sufficient balance
2. Send first gift (₹50)
3. Verify balance and remaining time update
4. Send second gift (₹50)
5. Verify balance and remaining time update
6. Send third gift (₹50)
7. Verify warnings appear if balance is low
8. Monitor for potential automatic disconnection

---

### 9. Network Interruption During Call

**Setup:**
- Simulate network disconnection during active call
- User balance: ₹100
- Call rate: ₹10/minute

**Expected Behavior:**
- ✅ Balance monitoring continues with last known balance
- ✅ Call continues using local calculations
- ✅ No errors shown to user
- ✅ When network reconnects, balance refreshes
- ✅ If balance is insufficient, call ends appropriately

**Test Steps:**
1. Start call with sufficient balance
2. Disconnect network (disable WiFi/Data)
3. Continue call for 30 seconds
4. Verify call continues normally
5. Reconnect network
6. Verify balance refreshes
7. If balance is low, verify warnings appear

---

### 10. Rapid Balance Depletion

**Setup:**
- User balance: ₹100
- Call rate: ₹50/minute (high rate)
- Simulate rapid cost accumulation

**Expected Behavior:**
- ✅ Balance monitoring keeps up with rapid changes
- ✅ Warnings appear at appropriate thresholds
- ✅ Call ends before negative balance
- ✅ No race conditions or calculation errors
- ✅ UI updates smoothly without lag

**Test Steps:**
1. Start call with high rate creator
2. Monitor balance decreasing rapidly
3. Verify warnings appear at correct thresholds
4. Verify call ends before negative balance
5. Check for any UI lag or calculation errors

---

### 11. Video Call Balance Monitoring

**Setup:**
- User balance: ₹100
- Video call rate: ₹20/minute
- Test with video call enabled

**Expected Behavior:**
- ✅ Balance monitoring works for video calls
- ✅ All warnings and disconnections work correctly
- ✅ Video stream continues until balance exhausted
- ✅ Balance display visible in video call UI
- ✅ Compact mode used for video calls

**Test Steps:**
1. Start video call with sufficient balance
2. Verify balance display in video call UI
3. Monitor balance decreasing
4. Verify warnings appear appropriately
5. Verify call ends when balance exhausted

---

### 12. Audio Call Balance Monitoring

**Setup:**
- User balance: ₹100
- Audio call rate: ₹10/minute
- Test with audio call enabled

**Expected Behavior:**
- ✅ Balance monitoring works for audio calls
- ✅ All warnings and disconnections work correctly
- ✅ Full BalanceMonitor component displayed
- ✅ Detailed cost breakdown visible
- ✅ All alerts and warnings displayed

**Test Steps:**
1. Start audio call with sufficient balance
2. Verify full BalanceMonitor component displayed
3. Monitor balance decreasing
4. Verify warnings appear appropriately
5. Verify call ends when balance exhausted

---

### 12. Recharge During Low Balance Warning

**Setup:**
- User balance: ₹40 (below warning threshold)
- Call rate: ₹10/minute
- Recharge with ₹100 during call

**Expected Behavior:**
- ✅ User can click recharge button during call
- ✅ Recharge flow works normally
- ✅ After recharge, balance updates immediately
- ✅ Warnings disappear if balance is now sufficient
- ✅ Remaining time recalculated
- ✅ Call continues normally

**Test Steps:**
1. Start call with balance below warning threshold
2. Verify warning appears
3. Click recharge button
4. Complete recharge flow
5. Verify balance updates
6. Verify warnings disappear
7. Verify remaining time increases
8. Verify call continues normally

---

### 13. Edge Case: Balance Exactly at Threshold

**Setup:**
- User balance: ₹50 (exactly at warning threshold)
- Call rate: ₹10/minute

**Expected Behavior:**
- ✅ Warning appears when balance drops below ₹50 (not at ₹50)
- ✅ No warning at exactly ₹50
- ✅ Warning appears at ₹49.99 or lower

**Test Steps:**
1. Start call with balance exactly at warning threshold
2. Monitor balance as it decreases
3. Verify warning appears when balance goes below ₹50
4. Verify no warning at exactly ₹50

---

### 14. Edge Case: Zero Balance at Call Start

**Setup:**
- User balance: ₹0
- Attempt to start call

**Expected Behavior:**
- ✅ Call should not start (handled by existing validation)
- ✅ User shown insufficient balance message
- ✅ Prompt to recharge

**Test Steps:**
1. Set user balance to ₹0
2. Attempt to start a call
3. Verify call doesn't start
4. Verify insufficient balance message shown
5. Verify recharge prompt appears

---

### 15. Edge Case: Very Small Balance

**Setup:**
- User balance: ₹1
- Call rate: ₹10/minute

**Expected Behavior:**
- ✅ Call starts (if validation allows)
- ✅ Call ends almost immediately (within seconds)
- ✅ Appropriate toast notification shown
- ✅ No negative balance

**Test Steps:**
1. Start call with ₹1 balance
2. Monitor call duration
3. Verify call ends quickly
4. Verify toast notification
5. Verify balance is exactly ₹0

---

## UI Component Testing

### BalanceMonitor Component

**Test Cases:**
1. **Compact Mode (Video Calls)**
   - ✅ Shows only balance and countdown badge
   - ✅ Responsive sizing for mobile
   - ✅ Color changes based on severity

2. **Full Mode (Audio Calls)**
   - ✅ Shows complete balance information
   - ✅ Displays cost breakdown
   - ✅ Shows all alerts and warnings
   - ✅ Countdown timer with time format

3. **Severity Levels**
   - ✅ Normal: Default colors
   - ✅ Warning: Yellow/orange colors
   - ✅ Critical: Red colors with destructive variant
   - ✅ Insufficient: Red with X icon

4. **Alerts**
   - ✅ Low Balance alert appears at warning threshold
   - ✅ Critical Balance alert appears at critical threshold
   - ✅ Call Ending Soon alert with pulsing animation
   - ✅ Insufficient Balance alert when balance ≤ 0

---

## Integration Testing

### End-to-End Flow

**Scenario: User starts call, balance gets low, recharges, continues call**

1. ✅ User starts call with ₹100 balance
2. ✅ Call progresses normally
3. ✅ Balance drops below ₹50 - warning appears
4. ✅ User clicks recharge button
5. ✅ Recharge flow completes successfully
6. ✅ Balance updates to ₹200
7. ✅ Warnings disappear
8. ✅ Call continues normally
9. ✅ User ends call manually
10. ✅ Final cost deducted correctly

---

## Performance Testing

### Balance Monitoring Performance

**Test Cases:**
1. ✅ Polling interval of 2 seconds doesn't cause UI lag
2. ✅ Multiple balance updates per second handled smoothly
3. ✅ No memory leaks during long calls (30+ minutes)
4. ✅ Balance calculations are accurate and fast
5. ✅ Toast notifications don't stack or duplicate

---

## Accessibility Testing

**Test Cases:**
1. ✅ All alerts have proper ARIA labels
2. ✅ Color warnings have text indicators
3. ✅ Keyboard navigation works for recharge button
4. ✅ Screen reader announces balance changes
5. ✅ Pulsing animations respect prefers-reduced-motion

---

## Browser Compatibility

**Test Browsers:**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

**Test Cases:**
1. ✅ Balance monitoring works on all browsers
2. ✅ Toast notifications display correctly
3. ✅ Animations work smoothly
4. ✅ Responsive design works on all screen sizes

---

## Error Handling

**Test Cases:**
1. ✅ Network error during balance refresh - call continues
2. ✅ API timeout - uses last known balance
3. ✅ Invalid balance data - defaults to safe value
4. ✅ Missing user ID - generates new ID
5. ✅ Concurrent balance updates - handles race conditions

---

## Manual Testing Checklist

### Pre-Call Setup
- [ ] User has sufficient balance to start call
- [ ] Call rate is correctly displayed
- [ ] Billing policy is visible

### During Call
- [ ] Balance updates every 2 seconds
- [ ] Remaining time countdown works
- [ ] Cost breakdown is accurate
- [ ] Warnings appear at correct thresholds
- [ ] Recharge button is accessible
- [ ] Gift sending updates balance

### Low Balance Scenarios
- [ ] Warning appears at ₹50 threshold
- [ ] Critical warning appears at ₹20 threshold
- [ ] Call ending soon alert at 20 seconds
- [ ] Recharge button shows urgency
- [ ] Pulsing animations work

### Call Termination
- [ ] Call ends when balance reaches zero
- [ ] No negative balance occurs
- [ ] Toast notification shows correct reason
- [ ] User is navigated away from call
- [ ] Final cost is deducted correctly

### After Call
- [ ] Balance is updated correctly
- [ ] Call history is recorded
- [ ] User can start new call if balance sufficient

---

## Automated Testing Recommendations

### Unit Tests
```typescript
// useCallBalanceMonitor.test.ts
describe('useCallBalanceMonitor', () => {
  it('should calculate live balance correctly', () => {});
  it('should trigger warning at threshold', () => {});
  it('should trigger critical at threshold', () => {});
  it('should disconnect when balance <= 0', () => {});
  it('should update gift cost correctly', () => {});
  it('should reset monitoring on call end', () => {});
});

// BalanceMonitor.test.tsx
describe('BalanceMonitor', () => {
  it('should display compact mode correctly', () => {});
  it('should display full mode correctly', () => {});
  it('should show warning alert', () => {});
  it('should show critical alert', () => {});
  it('should show call ending soon alert', () => {});
  it('should format time correctly', () => {});
});
```

### Integration Tests
```typescript
// CallInterface.integration.test.tsx
describe('CallInterface Balance Integration', () => {
  it('should monitor balance during call', () => {});
  it('should show warnings appropriately', () => {});
  it('should disconnect on insufficient balance', () => {});
  it('should handle recharge during call', () => {});
  it('should handle gifts during call', () => {});
});
```

---

## Known Limitations

1. **Network Latency**: Balance polling has 2-second interval, may not catch rapid changes
2. **Server-Side Validation**: Final balance validation happens on server during call end
3. **Concurrent Calls**: System assumes one active call per user
4. **Time Synchronization**: Client and server time differences may affect billing

---

## Future Enhancements

1. **WebSocket Integration**: Real-time balance updates instead of polling
2. **Pre-Call Balance Check**: Warn user before call if balance is low
3. **Balance Reserve**: Option to reserve minimum balance for emergencies
4. **Call Extension**: Allow user to extend call with quick recharge
5. **Balance History**: Show balance trend during call
6. **Smart Thresholds**: Adjust thresholds based on call rate

---

## Conclusion

The balance monitoring and call disconnection system provides:
- ✅ Real-time balance tracking during calls
- ✅ Proactive warnings at configurable thresholds
- ✅ Automatic call termination to prevent negative balance
- ✅ Clear visual feedback and notifications
- ✅ Seamless integration with existing call flow
- ✅ Comprehensive error handling
- ✅ Responsive and accessible UI

All test scenarios should be verified before deploying to production.
