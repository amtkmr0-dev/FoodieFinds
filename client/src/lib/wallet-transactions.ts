export interface TalktimeTransaction {
  id: string;
  date: string;
  createdAt: string;
  amount: number;
  bonus: number;
  total: number;
  paymentMethod?: string;
  transactionId?: string;
  type?: "recharge" | "call";
  status?: "success" | "pending" | "failed";
}

const TALKTIME_TRANSACTIONS_KEY = "foodiefinds_talktime_transactions";
const TALKTIME_TRANSACTIONS_EVENT = "foodiefinds-talktime-transactions-change";

function parseTransactions(rawTransactions: string | null): TalktimeTransaction[] {
  if (!rawTransactions) return [];

  try {
    const parsed = JSON.parse(rawTransactions);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getTalktimeTransactions(): TalktimeTransaction[] {
  return parseTransactions(localStorage.getItem(TALKTIME_TRANSACTIONS_KEY));
}

export function saveTalktimeTransactions(transactions: TalktimeTransaction[]) {
  localStorage.setItem(TALKTIME_TRANSACTIONS_KEY, JSON.stringify(transactions));
  window.dispatchEvent(new CustomEvent(TALKTIME_TRANSACTIONS_EVENT));
}

export function subscribeToTalktimeTransactions(callback: () => void) {
  const handleChange = () => callback();
  window.addEventListener(TALKTIME_TRANSACTIONS_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(TALKTIME_TRANSACTIONS_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function recordRechargeTransaction(transaction: Omit<TalktimeTransaction, "id" | "date" | "createdAt" | "status"> & {
  id?: string;
  date?: string;
  createdAt?: string;
  status?: TalktimeTransaction["status"];
}) {
  const createdAt = transaction.createdAt || new Date().toISOString();
  const nextTransaction: TalktimeTransaction = {
    id: transaction.id || transaction.transactionId || `local_${Date.now()}`,
    date: transaction.date || new Date(createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    createdAt,
    amount: transaction.amount,
    bonus: transaction.bonus,
    total: transaction.total,
    paymentMethod: transaction.paymentMethod,
    transactionId: transaction.transactionId,
    type: transaction.type || "recharge",
    status: transaction.status || "success",
  };

  const existingTransactions = getTalktimeTransactions().filter((item) => {
    if (nextTransaction.transactionId && item.transactionId) {
      return item.transactionId !== nextTransaction.transactionId;
    }

    return item.id !== nextTransaction.id;
  });

  const updatedTransactions = [nextTransaction, ...existingTransactions];
  saveTalktimeTransactions(updatedTransactions);
  return updatedTransactions;
}

export function recordCallWalletTransaction(transaction: {
  transactionId: string;
  amount: number;
  creatorName: string;
  callType: "audio" | "video" | string;
}) {
  const existingTransactions = getTalktimeTransactions();
  const createdAt = new Date().toISOString();
  const nextTransaction: TalktimeTransaction = {
    id: transaction.transactionId,
    date: new Date(createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    createdAt,
    amount: transaction.amount,
    bonus: 0,
    total: -transaction.amount,
    paymentMethod: `${transaction.callType === "video" ? "Video" : "Audio"} call with ${transaction.creatorName}`,
    transactionId: transaction.transactionId,
    type: "call",
    status: "success",
  };

  const updatedTransactions = [
    nextTransaction,
    ...existingTransactions.filter((item) => item.transactionId !== transaction.transactionId),
  ];

  saveTalktimeTransactions(updatedTransactions);
  return updatedTransactions;
}
