import { getSupabase } from "@/lib/supabase";

export async function createPaymentAttempt(
  bookingId: string,
  orderId: string,
  grossAmount: number,
): Promise<void> {
  const { error } = await getSupabase()
    .from("payment_attempts")
    .insert({ booking_id: bookingId, order_id: orderId, gross_amount: grossAmount });
  if (error) throw error;
}
