export type CreatorCallStatus = "available" | "on_call" | "offline";

export type CreatorStatusRecord = {
  creatorId: string;
  status: CreatorCallStatus;
  callStatus: CreatorCallStatus;
  updatedAt: string;
};

const CREATOR_STATUS_EVENT = "linky-creator-status-change";

export function getCreatorStatusKey(creatorId: string) {
  return `linky_creator_status_${creatorId}`;
}

export function setLocalCreatorStatus(creatorId: string, status: CreatorCallStatus) {
  const record: CreatorStatusRecord = {
    creatorId,
    status,
    callStatus: status,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(getCreatorStatusKey(creatorId), JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(CREATOR_STATUS_EVENT, { detail: record }));
  return record;
}

export function getLocalCreatorStatus(creatorId: string): CreatorStatusRecord {
  const stored = localStorage.getItem(getCreatorStatusKey(creatorId));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to default status.
    }
  }

  return {
    creatorId,
    status: "available",
    callStatus: "available",
    updatedAt: new Date().toISOString(),
  };
}

export async function updateCreatorStatus(creatorId: string, status: CreatorCallStatus) {
  const record = setLocalCreatorStatus(creatorId, status);

  try {
    const response = await fetch(`/api/creator/${creatorId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      const serverRecord = await response.json();
      setLocalCreatorStatus(creatorId, serverRecord.status || status);
      return serverRecord as CreatorStatusRecord;
    }
  } catch {
    // Local status keeps the UI responsive if the API is unavailable.
  }

  return record;
}

export function subscribeToCreatorStatus(callback: (record: CreatorStatusRecord) => void) {
  const handleEvent = (event: Event) => {
    const record = (event as CustomEvent<CreatorStatusRecord>).detail;
    if (record) callback(record);
  };

  const handleStorage = (event: StorageEvent) => {
    if (!event.key?.startsWith("linky_creator_status_") || !event.newValue) return;
    try {
      callback(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed local status.
    }
  };

  window.addEventListener(CREATOR_STATUS_EVENT, handleEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CREATOR_STATUS_EVENT, handleEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
