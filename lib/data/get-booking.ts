import { getSupabase } from "@/lib/supabase";

export type BookingDetail = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  parent_name: string;
  class_id: string;
  class_subject: string;
  class_starts_at: string;
  // What the provider last told us about the most recent attempt, or null when
  // no notification has arrived yet.
  payment_status: string | null;
};

type Row = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  students: { name: string; parents: { name: string } };
  trial_classes: { id: string; subject: string; starts_at: string };
  payment_attempts: { provider_status: string | null; created_at: string }[];
};

export async function getBooking(bookingId: string): Promise<BookingDetail | null> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select(
      "id, status, created_at, updated_at, students(name, parents(name)), trial_classes(id, subject, starts_at), payment_attempts(provider_status, created_at)",
    )
    .eq("id", bookingId)
    .maybeSingle()
    .overrideTypes<Row | null, { merge: false }>();
  if (error) throw error;
  if (!data) return null;

  const latestAttempt = [...data.payment_attempts].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  )[0];
  return {
    id: data.id,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    student_name: data.students.name,
    parent_name: data.students.parents.name,
    class_id: data.trial_classes.id,
    class_subject: data.trial_classes.subject,
    class_starts_at: data.trial_classes.starts_at,
    payment_status: latestAttempt?.provider_status ?? null,
  };
}
