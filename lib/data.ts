import { getSupabase } from "@/lib/supabase";

export type Parent = { id: string; name: string };
export type Student = { id: string; name: string; grade: number };
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

export async function listParents(): Promise<Parent[]> {
  const { data, error } = await getSupabase().from("parents").select("id, name").order("name");
  if (error) throw error;
  return data;
}

export async function parentExists(parentId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("parents")
    .select("id")
    .eq("id", parentId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function listStudents(parentId: string): Promise<Student[]> {
  const { data, error } = await getSupabase()
    .from("students")
    .select("id, name, grade")
    .eq("parent_id", parentId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function listClasses(): Promise<TrialClass[]> {
  const { data, error } = await getSupabase()
    .from("trial_classes")
    .select("id, subject, starts_at, capacity, confirmed_count")
    .order("starts_at");
  if (error) throw error;
  return data.map((c) => ({ ...c, remaining_seats: c.capacity - c.confirmed_count }));
}
