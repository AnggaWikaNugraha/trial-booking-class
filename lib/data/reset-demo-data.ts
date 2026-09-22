import { getSupabase } from "@/lib/supabase";

export async function resetDemoData(): Promise<void> {
  const { error } = await getSupabase().rpc("reset_demo_data");
  if (error) throw error;
}
