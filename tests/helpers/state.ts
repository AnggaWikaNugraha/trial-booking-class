import { getSupabase } from "@/lib/supabase";

export async function bookingStatus(bookingId: string) {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();
  if (error) throw error;
  return data.status as string;
}

export async function confirmedCount(classId: string) {
  const { data, error } = await getSupabase()
    .from("trial_classes")
    .select("confirmed_count")
    .eq("id", classId)
    .single();
  if (error) throw error;
  return data.confirmed_count as number;
}

// Who would show up on the roster: confirmed bookings only.
export async function rosterNames(classId: string) {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("students(name)")
    .eq("class_id", classId)
    .eq("status", "confirmed")
    .overrideTypes<{ students: { name: string } }[], { merge: false }>();
  if (error) throw error;
  return data.map((b) => b.students.name).sort();
}
