import { queryClient } from "@/lib/queryClient";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: "payment.failed", handler: (response: any) => void) => void;
    };
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  };
  readonly?: {
    contact?: boolean;
    email?: boolean;
  };
  hidden?: {
    contact?: boolean;
    email?: boolean;
  };
  notes?: Record<string, string>;
  config?: {
    display?: {
      blocks?: Record<string, {
        name: string;
        instruments: Array<{
          method: string;
        }>;
      }>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayRechargeInput = {
  userId?: string;
  amount: number;
  paymentMethod: string;
  userName?: string;
  userPhone?: string;
};

let razorpayScriptPromise: Promise<void> | null = null;

function getStoredUserContact() {
  const storedUser = localStorage.getItem("auth_user");
  if (!storedUser) return "";

  try {
    const user = JSON.parse(storedUser);
    const rawPhone = String(user.phone || user.mobileNumber || user.mobile || "");
    const digits = rawPhone.replace(/\D/g, "");
    if (digits.length >= 10) {
      return `+91${digits.slice(-10)}`;
    }
  } catch {
    return "";
  }

  return "";
}

function getStoredUserName() {
  const storedUser = localStorage.getItem("auth_user");
  if (!storedUser) return "LINKY User";

  try {
    const user = JSON.parse(storedUser);
    return user.name || user.username || "LINKY User";
  } catch {
    return "LINKY User";
  }
}

function getRazorpayMethod(paymentMethod: string) {
  if (paymentMethod === "netbanking") return "netbanking";
  if (paymentMethod === "card") return "card";
  return "upi";
}

function getMethodLabel(method: string) {
  if (method === "card") return "Pay via Card";
  if (method === "netbanking") return "Pay via Net Banking";
  return "Pay via UPI";
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with ${response.status}`);
  }

  return data as T;
}

export async function startRazorpayRecharge({
  userId = "user_001",
  amount,
  paymentMethod,
  userName = getStoredUserName(),
  userPhone,
}: RazorpayRechargeInput) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount. Amount must be a positive number.");
  }

  await loadRazorpayScript();

  const order = await postJson<{
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    bonus: number;
    totalAmount: number;
  }>("/api/razorpay/orders", {
    userId,
    amount,
    paymentMethod,
  });

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout is unavailable.");
  }

  return await new Promise<any>((resolve, reject) => {
    const method = getRazorpayMethod(paymentMethod);
    const contact = userPhone || getStoredUserContact() || "+919999999999";

    const checkout = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "LINKY",
      description: `Wallet recharge ₹${amount}`,
      order_id: order.orderId,
      prefill: {
        name: userName,
        email: "test@linky.app",
        contact,
        method,
      },
      readonly: {
        contact: true,
        email: true,
      },
      hidden: {
        contact: true,
        email: true,
      },
      notes: {
        userId,
        paymentMethod,
      },
      config: {
        display: {
          blocks: {
            selected_method: {
              name: getMethodLabel(method),
              instruments: [
                {
                  method,
                },
              ],
            },
          },
          sequence: ["block.selected_method"],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
      theme: {
        color: "#6757e8",
      },
      handler: async (response) => {
        try {
          const verified = await postJson<any>("/api/razorpay/verify", {
            userId,
            paymentMethod,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verified.wallet) {
            queryClient.setQueryData(["/api/wallet", userId], verified.wallet);
          }
          queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
          queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });

          resolve(verified);
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled by user.")),
      },
    });

    checkout.on("payment.failed", (response: any) => {
      reject(new Error(response?.error?.description || "Payment failed."));
    });

    checkout.open();
  });
}
