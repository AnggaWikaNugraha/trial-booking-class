import { confirmPayment } from "@/lib/data/confirm-payment";
import { jsonError } from "@/lib/http";
import { readPaymentOutcome, verifyNotificationSignature, type MidtransNotification } from "@/lib/midtrans";

function isNotification(body: unknown): body is MidtransNotification {
  const n = body as MidtransNotification | null;
  return Boolean(n?.order_id && n?.status_code && n?.gross_amount && n?.transaction_status);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!isNotification(body)) return jsonError(400, "Not a Midtrans notification");
  if (!verifyNotificationSignature(body)) return jsonError(401, "Invalid signature");

  const outcome = readPaymentOutcome(body);
  if (outcome === "ignore") {
    return Response.json({ ignored: true, transaction_status: body.transaction_status });
  }

  const status = await confirmPayment(body.order_id, outcome === "success", body.transaction_status);
  // An unknown order_id is answered with 200 so Midtrans stops retrying a
  // notification we can never match to a booking.
  if (!status) return Response.json({ ignored: true, reason: "unknown order_id" });
  return Response.json({ status });
}
