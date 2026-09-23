import { createHash, timingSafeEqual } from "node:crypto";

const SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

function serverKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY must be set");
  return key;
}

export type SnapTransactionInput = {
  orderId: string;
  grossAmount: number;
  itemName: string;
  customer: { firstName: string; email: string };
};

export type SnapTransaction = { token: string; redirect_url: string };

export async function createSnapTransaction(input: SnapTransactionInput): Promise<SnapTransaction> {
  // Sends this transaction's notifications to our own webhook instead of the
  // URL configured in the Midtrans dashboard, which may belong to another
  // project. Leave unset to use the dashboard URL.
  const overrideUrl = process.env.MIDTRANS_NOTIFICATION_URL;

  const res = await fetch(SNAP_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`,
      ...(overrideUrl ? { "X-Override-Notification": overrideUrl } : {}),
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
      item_details: [
        { id: "trial-class", price: input.grossAmount, quantity: 1, name: input.itemName.slice(0, 50) },
      ],
      customer_details: { first_name: input.customer.firstName, email: input.customer.email },
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Midtrans Snap ${res.status}: ${(body.error_messages ?? []).join("; ")}`);
  }
  return body;
}

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
};

// Midtrans signs every notification with SHA512 over order_id, status_code,
// gross_amount and the server key. Anyone can POST to the webhook, so this is
// what proves the notification really came from Midtrans.
export function verifyNotificationSignature(n: MidtransNotification): boolean {
  const expected = createHash("sha512")
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey()}`)
    .digest("hex");
  const given = String(n.signature_key ?? "");
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export type PaymentOutcome = "success" | "failure" | "ignore";

// "ignore" means the payment has not been decided yet, so the booking stays
// pending_payment and waits for the next notification.
export function readPaymentOutcome(n: MidtransNotification): PaymentOutcome {
  switch (n.transaction_status) {
    case "capture":
      // A captured card can still be held for manual fraud review.
      return n.fraud_status === "accept" ? "success" : "ignore";
    case "settlement":
      return "success";
    case "deny":
    case "cancel":
    case "expire":
    case "failure":
      return "failure";
    default:
      // pending, authorize, and anything Midtrans adds later.
      return "ignore";
  }
}
