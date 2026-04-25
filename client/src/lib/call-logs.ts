export interface CallLogRecord {
  id: string;
  userId: string;
  userName: string;
  creatorId: string;
  creatorName: string;
  callType: "audio" | "video" | string;
  durationSeconds: number;
  durationLabel: string;
  pricePerMinute: number;
  callCost: number;
  giftCost: number;
  totalCost: number;
  creatorEarnings: number;
  status: "completed" | "missed" | "failed";
  createdAt: string;
  date: string;
}

const CALL_LOGS_KEY = "foodiefinds_call_logs";
const CALL_LOG_EVENT = "foodiefinds-call-log-change";

function parseCallLogs(rawLogs: string | null): CallLogRecord[] {
  if (!rawLogs) return [];

  try {
    const parsed = JSON.parse(rawLogs);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCallLogs() {
  return parseCallLogs(localStorage.getItem(CALL_LOGS_KEY));
}

export function getUserCallLogs(userId?: string) {
  const logs = getCallLogs();
  return userId ? logs.filter((log) => log.userId === userId) : logs;
}

export function getCreatorCallLogs(creatorId?: string) {
  const logs = getCallLogs();
  return creatorId ? logs.filter((log) => log.creatorId === creatorId) : logs;
}

export function subscribeToCallLogs(callback: () => void) {
  const handleChange = () => callback();
  window.addEventListener(CALL_LOG_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(CALL_LOG_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function recordCallLog(record: Omit<CallLogRecord, "id" | "createdAt" | "date" | "durationLabel" | "status"> & {
  id?: string;
  status?: CallLogRecord["status"];
}) {
  const createdAt = new Date().toISOString();
  const mins = Math.floor(record.durationSeconds / 60);
  const secs = record.durationSeconds % 60;
  const durationLabel = `${mins}:${secs.toString().padStart(2, "0")}`;
  const nextRecord: CallLogRecord = {
    ...record,
    id: record.id || `CALL${Date.now()}`,
    status: record.status || "completed",
    createdAt,
    date: new Date(createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    durationLabel,
  };

  const updatedLogs = [
    nextRecord,
    ...getCallLogs().filter((log) => log.id !== nextRecord.id),
  ];

  localStorage.setItem(CALL_LOGS_KEY, JSON.stringify(updatedLogs));
  window.dispatchEvent(new CustomEvent(CALL_LOG_EVENT));
  return updatedLogs;
}
