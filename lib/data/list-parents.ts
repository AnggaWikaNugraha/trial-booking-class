import { getSupabase } from "@/lib/supabase";

export type Parent = { id: string; name: string };

export async function listParents(): Promise<Parent[]> {
  const { data, error } = await getSupabase().from("parents").select("id, name").order("name");
  if (error) throw error;
  return data;
}
