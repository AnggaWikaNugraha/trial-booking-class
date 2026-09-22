import { getSupabase } from "@/lib/supabase";

export type ClassSeats = { id: string; capacity: number; confirmed_count: number };

export async function getClass(classId: string): Promise<ClassSeats | null> {
  const { data, error } = await getSupabase()
    .from("trial_classes")
    .select("id, capacity, confirmed_count")
    .eq("id", classId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
