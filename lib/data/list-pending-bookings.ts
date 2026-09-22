import { getSupabase } from "@/lib/supabase";

export type PendingBooking = {
  id: string;
  created_at: string;
  student_name: string;
  parent_name: string;
  class_subject: string;
};

type Row = {
  id: string;
  created_at: string;
  students: { name: string; parents: { name: string } };
  trial_classes: { subject: string };
};

// Bookings that have not paid yet. They do not hold a seat, so several of them
// can be waiting on the last seat at once.
export async function listPendingBookings(): Promise<PendingBooking[]> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("id, created_at, students(name, parents(name)), trial_classes(subject)")
    .eq("status", "pending_payment")
    .order("created_at")
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw error;
  return data.map((b) => ({
    id: b.id,
    created_at: b.created_at,
    student_name: b.students.name,
    parent_name: b.students.parents.name,
    class_subject: b.trial_classes.subject,
  }));
}
