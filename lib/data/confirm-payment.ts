import { getSupabase } from "@/lib/supabase";

export type ConfirmedStatus = "confirmed" | "payment_failed" | "rejected_class_full";

// Runs the confirm_payment transaction in Postgres. Returns the booking status
// after processing, or null when the order_id is unknown.
export async function confirmPayment(
  orderId: string,
  paid: boolean,
  providerStatus: string,
): Promise<ConfirmedStatus | null> {
  const { data, error } = await getSupabase().rpc("confirm_payment", {
    p_order_id: orderId,
    p_paid: paid,
    p_provider_status: providerStatus,
  });
  if (error) throw error;
  return data;
}
