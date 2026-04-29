export type GiftRequestSignal = {
  id: string;
  roomId: string;
  creatorId: string;
  creatorName: string;
  requesterId: string;
  requesterName: string;
  giftId: string;
  giftName: string;
  giftAmount: number;
  quantity: number;
  createdAt: number;
  status: "requested" | "accepted" | "rejected";
  responderId?: string;
  responderName?: string;
  walletBalance?: number;
  transactionId?: string;
};

const GIFT_REQUEST_EVENT = "linky-gift-request";
const GIFT_REQUEST_STORAGE_KEY = "linky_latest_gift_request";

function getChannel() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  return new BroadcastChannel(GIFT_REQUEST_EVENT);
}

export function publishGiftRequestSignal(request: GiftRequestSignal) {
  localStorage.setItem(GIFT_REQUEST_STORAGE_KEY, JSON.stringify(request));
  window.dispatchEvent(new CustomEvent(GIFT_REQUEST_EVENT, { detail: request }));

  const channel = getChannel();
  channel?.postMessage(request);
  channel?.close();
}

export function subscribeToGiftRequestSignals(callback: (request: GiftRequestSignal) => void) {
  const handleRequest = (request: GiftRequestSignal) => {
    if (Date.now() - request.createdAt > 5 * 60_000) return;
    callback(request);
  };

  const handleCustomEvent = (event: Event) => {
    const request = (event as CustomEvent<GiftRequestSignal>).detail;
    if (request) handleRequest(request);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== GIFT_REQUEST_STORAGE_KEY || !event.newValue) return;
    try {
      handleRequest(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed local testing events.
    }
  };

  const channel = getChannel();
  const handleMessage = (event: MessageEvent<GiftRequestSignal>) => handleRequest(event.data);
  channel?.addEventListener("message", handleMessage);
  window.addEventListener(GIFT_REQUEST_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.removeEventListener("message", handleMessage);
    channel?.close();
    window.removeEventListener(GIFT_REQUEST_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
