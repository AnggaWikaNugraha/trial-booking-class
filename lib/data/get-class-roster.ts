import { getSupabase } from "@/lib/supabase";

export type RosterEntry = {
  booking_id: string;
  student_name: string;
  grade: number;
  parent_name: string;
  confirmed_at: string;
};

export type ClassRoster = {
  class_id: string;
  subject: string;
  starts_at: string;
  capacity: number;
  confirmed_count: number;
  remaining_seats: number;
  students: RosterEntry[];
};

type Row = {
  id: string;
  subject: string;
  starts_at: string;
  capacity: number;
  confirmed_count: number;
  bookings: {
    id: string;
    updated_at: string;
    students: { name: string; grade: number; parents: { name: string } };
  }[];
};

// Only confirmed bookings, so a failed payment or a booking that lost the last
// seat never shows up on the roster.
export async function getClassRoster(classId: string): Promise<ClassRoster | null> {
  const { data, error } = await getSupabase()
    .from("trial_classes")
    .select(
      "id, subject, starts_at, capacity, confirmed_count, bookings(id, updated_at, students(name, grade, parents(name)))",
    )
    .eq("id", classId)
    .eq("bookings.status", "confirmed")
    .maybeSingle()
    .overrideTypes<Row | null, { merge: false }>();
  if (error) throw error;
  if (!data) return null;

  return {
    class_id: data.id,
    subject: data.subject,
    starts_at: data.starts_at,
    capacity: data.capacity,
    confirmed_count: data.confirmed_count,
    remaining_seats: data.capacity - data.confirmed_count,
    students: data.bookings
      .map((b) => ({
        booking_id: b.id,
        student_name: b.students.name,
        grade: b.students.grade,
        parent_name: b.students.parents.name,
        confirmed_at: b.updated_at,
      }))
      .sort((a, b) => a.student_name.localeCompare(b.student_name)),
  };
}
