import { getSupabase } from "@/lib/supabase";

export type Student = { id: string; name: string; grade: number };

export async function listStudents(parentId: string): Promise<Student[]> {
  const { data, error } = await getSupabase()
    .from("students")
    .select("id, name, grade")
    .eq("parent_id", parentId)
    .order("name");
  if (error) throw error;
  return data;
}
