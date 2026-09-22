import { randomUUID } from "node:crypto";
import { getSupabase } from "@/lib/supabase";

// Tests run against the online Supabase project and wipe it. Run
// `npm run db:reset` afterwards to restore the demo seed.
const TABLES_IN_DELETE_ORDER = [
  "payment_attempts",
  "bookings",
  "students",
  "parents",
  "trial_classes",
] as const;

export async function resetDb() {
  const db = getSupabase();
  for (const table of TABLES_IN_DELETE_ORDER) {
    // PostgREST refuses a DELETE without a filter; this one matches every row.
    const { error } = await db.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`reset ${table}: ${error.message}`);
  }
}

export async function createParent() {
  const { data, error } = await getSupabase()
    .from("parents")
    .insert({ name: "Test Parent", email: `parent-${randomUUID()}@example.com` })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string; name: string; email: string };
}

export async function createStudent(parentId: string, name = "Test Student") {
  const { data, error } = await getSupabase()
    .from("students")
    .insert({ parent_id: parentId, name, grade: 3 })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string; parent_id: string; name: string; grade: number };
}

// confirmedCount sets the seat counter directly, standing in for earlier
// confirmed bookings. Only fixtures may do this; app code goes through confirm_payment.
export async function createClass({ confirmedCount = 0, subject = "Test Trial" } = {}) {
  const { data, error } = await getSupabase()
    .from("trial_classes")
    .insert({
      subject,
      starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      confirmed_count: confirmedCount,
    })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string; subject: string; capacity: number; confirmed_count: number };
}

export async function createBooking(studentId: string, classId: string, status = "pending_payment") {
  const { data, error } = await getSupabase()
    .from("bookings")
    .insert({ student_id: studentId, class_id: classId, status })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string; student_id: string; class_id: string; status: string };
}
