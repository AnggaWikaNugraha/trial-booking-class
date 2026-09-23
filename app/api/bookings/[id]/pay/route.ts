import { createPaymentAttempt } from "@/lib/data/create-payment-attempt";
import { getBookingForPayment } from "@/lib/data/get-booking-for-payment";
import { isUuid, jsonError } from "@/lib/http";
import { createSnapTransaction } from "@/lib/midtrans";
import { TRIAL_PRICE_IDR } from "@/lib/trial-price";

export async function POST(_req: Request, ctx: RouteContext<"/api/bookings/[id]/pay">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(400, "Invalid booking id");

  const booking = await getBookingForPayment(id);
  if (!booking) return jsonError(404, "Booking not found");
  if (booking.status !== "pending_payment") {
    return jsonError(409, `This booking is ${booking.status} and cannot be paid`);
  }

  // Midtrans rejects a reused order_id, so every attempt gets a fresh one.
  // The timestamp suffix keeps it within Midtrans's 50 character limit.
  const orderId = `${booking.id}-${Date.now().toString(36)}`;
  // Record the attempt before Midtrans knows about it, so a webhook for this
  // order_id can always be matched back to the booking.
  await createPaymentAttempt(booking.id, orderId, TRIAL_PRICE_IDR);

  try {
    const snap = await createSnapTransaction({
      orderId,
      grossAmount: TRIAL_PRICE_IDR,
      itemName: `${booking.class_subject} for ${booking.student_name}`,
      customer: { firstName: booking.parent_name, email: booking.parent_email },
    });
    return Response.json({ order_id: orderId, token: snap.token, redirect_url: snap.redirect_url });
  } catch (err) {
    console.error(err);
    return jsonError(502, "The payment provider is unavailable, please try again");
  }
}
