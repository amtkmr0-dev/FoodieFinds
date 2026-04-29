import { generateUUID } from "@/lib/auth";

export interface ZegoTokenResponse {
  appId: number;
  serverUrl: string;
  token: string;
  userId: string;
  roomId: string;
  expiresIn: number;
}

export function getZegoUserId() {
  let userId = localStorage.getItem("linky_device_id");
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem("linky_device_id", userId);
  }
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getZegoUserName() {
  const storedUser = localStorage.getItem("auth_user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.username || user.phone || user.userId || "LINKY User";
    } catch {
      return localStorage.getItem("linky_username") || "LINKY User";
    }
  }
  return localStorage.getItem("linky_username") || "LINKY User";
}

export function createZegoRoomId(creatorId: string) {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("roomId");
  if (fromUrl) {
    return fromUrl.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 128);
  }

  const userId = getZegoUserId();
  return `linky_${creatorId}_${userId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 128);
}

export function createZegoStreamId(roomId: string, userId: string) {
  return `${roomId}_${userId}_stream`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256);
}

export async function fetchZegoToken(roomId: string, userId: string): Promise<ZegoTokenResponse> {
  const cacheKey = `linky_zego_token_${roomId}_${userId}`;
  const cachedRaw = sessionStorage.getItem(cacheKey);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as ZegoTokenResponse & { cachedAt: number };
      const ageSeconds = (Date.now() - cached.cachedAt) / 1000;
      if (ageSeconds < Math.max(60, cached.expiresIn - 300)) {
        return cached;
      }
    } catch {
      sessionStorage.removeItem(cacheKey);
    }
  }

  const response = await fetch("/api/zego/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, userId, canPublish: true }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Could not create ZEGOCLOUD token. API returned ${response.status}.`);
  }

  const tokenData = data as ZegoTokenResponse;
  sessionStorage.setItem(cacheKey, JSON.stringify({ ...tokenData, cachedAt: Date.now() }));
  return tokenData;
}
