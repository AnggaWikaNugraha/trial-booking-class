import { getSupabase } from "@/lib/supabase";

export type BookingForPayment = {
  id: string;
  status: string;
  student_name: string;
  parent_name: string;
  parent_email: string;
  class_subject: string;
};

type Row = {
  id: string;
  status: string;
  students: { name: string; parents: { name: string; email: string } };
  trial_classes: { subject: string };
};

export async function getBookingForPayment(bookingId: string): Promise<BookingForPayment | null> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("id, status, students(name, parents(name, email)), trial_classes(subject)")
    .eq("id", bookingId)
    .maybeSingle()
    .overrideTypes<Row | null, { merge: false }>();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    student_name: data.students.name,
    parent_name: data.students.parents.name,
    parent_email: data.students.parents.email,
    class_subject: data.trial_classes.subject,
  };
}
