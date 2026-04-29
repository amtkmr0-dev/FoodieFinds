export type SimulatedIncomingCall = {
  id: string;
  creatorId: string;
  creatorName: string;
  callerId: string;
  callerName: string;
  roomId: string;
  callType: "audio" | "video";
  pricePerMinute: number;
  createdAt: number;
  status: "ringing" | "accepted" | "rejected" | "ended";
};

const CALL_SIGNAL_EVENT = "linky-call-signal";
const CALL_SIGNAL_STORAGE_KEY = "linky_latest_call_signal";

function getChannel() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  return new BroadcastChannel(CALL_SIGNAL_EVENT);
}

export function publishCallSignal(call: SimulatedIncomingCall) {
  localStorage.setItem(CALL_SIGNAL_STORAGE_KEY, JSON.stringify(call));
  window.dispatchEvent(new CustomEvent(CALL_SIGNAL_EVENT, { detail: call }));

  const channel = getChannel();
  channel?.postMessage(call);
  channel?.close();
}

export function subscribeToCallSignals(callback: (call: SimulatedIncomingCall) => void) {
  const handleCall = (call: SimulatedIncomingCall) => {
    if (Date.now() - call.createdAt > 60_000) return;
    callback(call);
  };

  const handleCustomEvent = (event: Event) => {
    const call = (event as CustomEvent<SimulatedIncomingCall>).detail;
    if (call) handleCall(call);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== CALL_SIGNAL_STORAGE_KEY || !event.newValue) return;
    try {
      handleCall(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed local testing events.
    }
  };

  const channel = getChannel();
  const handleMessage = (event: MessageEvent<SimulatedIncomingCall>) => handleCall(event.data);
  channel?.addEventListener("message", handleMessage);
  window.addEventListener(CALL_SIGNAL_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.removeEventListener("message", handleMessage);
    channel?.close();
    window.removeEventListener(CALL_SIGNAL_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
