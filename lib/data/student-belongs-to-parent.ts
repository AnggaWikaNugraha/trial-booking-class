import { getSupabase } from "@/lib/supabase";

export async function studentBelongsToParent(studentId: string, parentId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
