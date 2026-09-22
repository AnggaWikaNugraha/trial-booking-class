import { getSupabase } from "@/lib/supabase";

export type Booking = {
  id: string;
  student_id: string;
  class_id: string;
  status: string;
  created_at: string;
};

const UNIQUE_VIOLATION = "23505";

// The partial unique index decides duplicates, so two concurrent requests
// cannot both get through. There is no check-then-insert here on purpose.
export async function createBooking(
  studentId: string,
  classId: string,
): Promise<{ ok: true; booking: Booking } | { ok: false; reason: "duplicate" }> {
  const { data, error } = await getSupabase()
    .from("bookings")
    .insert({ student_id: studentId, class_id: classId })
    .select("id, student_id, class_id, status, created_at")
    .single();
  if (error?.code === UNIQUE_VIOLATION) return { ok: false, reason: "duplicate" };
  if (error) throw error;
  return { ok: true, booking: data };
}
