import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { TRIAL_PRICE_IDR } from "@/lib/trial-price";

// Builds the notification Midtrans would send, signed with the sandbox server
// key, so the webhook can be tested without a public URL.
export function signedNotification({
  orderId,
  transactionStatus = "settlement",
  statusCode = "200",
  grossAmount = `${TRIAL_PRICE_IDR}.00`,
  fraudStatus,
}: {
  orderId: string;
  transactionStatus?: string;
  statusCode?: string;
  grossAmount?: string;
  fraudStatus?: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const signature = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signature,
    transaction_status: transactionStatus,
    ...(fraudStatus ? { fraud_status: fraudStatus } : {}),
  };
}

// A payment attempt as POST /api/bookings/:id/pay would have recorded it.
export async function startPayment(bookingId: string) {
  const orderId = `${bookingId}-${Math.random().toString(36).slice(2, 10)}`;
  const { error } = await getSupabase()
    .from("payment_attempts")
    .insert({ booking_id: bookingId, order_id: orderId, gross_amount: TRIAL_PRICE_IDR });
  if (error) throw error;
  return orderId;
}
