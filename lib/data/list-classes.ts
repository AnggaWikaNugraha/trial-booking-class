import { getSupabase } from "@/lib/supabase";

export type TrialClass = {
  id: string;
  subject: string;
  starts_at: string;
  capacity: number;
  confirmed_count: number;
  // A hint for the UI only. The seat is claimed later by confirm_payment,
  // so this can be stale by the time the parent pays.
  remaining_seats: number;
};

export async function listClasses(): Promise<TrialClass[]> {
  const { data, error } = await getSupabase()
    .from("trial_classes")
    .select("id, subject, starts_at, capacity, confirmed_count")
    .order("starts_at");
  if (error) throw error;
  return data.map((c) => ({ ...c, remaining_seats: c.capacity - c.confirmed_count }));
}
