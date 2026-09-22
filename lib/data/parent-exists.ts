import { getSupabase } from "@/lib/supabase";

export async function parentExists(parentId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("parents")
    .select("id")
    .eq("id", parentId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
