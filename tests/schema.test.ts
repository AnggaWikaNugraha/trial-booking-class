import { beforeEach, describe, expect, it } from "vitest";
import { getSupabase } from "@/lib/supabase";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";

// Checks that the guards in the migration are live in the database. The
// behavior tests (P1-P5, N1-N9) exercise them through the API.
describe("schema guards", () => {
  beforeEach(resetDb);

  it("rejects a second active booking for the same child and class", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id);
    const cls = await createClass();
    await createBooking(student.id, cls.id);

    const { error } = await getSupabase()
      .from("bookings")
      .insert({ student_id: student.id, class_id: cls.id });
    expect(error?.code).toBe("23505");
  });

  it("allows a new booking once the previous one has failed", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id);
    const cls = await createClass();
    await createBooking(student.id, cls.id, "payment_failed");

    const { error } = await getSupabase()
      .from("bookings")
      .insert({ student_id: student.id, class_id: cls.id });
    expect(error).toBeNull();
  });

  it("rejects confirmed_count above capacity", async () => {
    const cls = await createClass({ confirmedCount: 4 });

    const { error } = await getSupabase()
      .from("trial_classes")
      .update({ confirmed_count: 5 })
      .eq("id", cls.id);
    expect(error?.code).toBe("23514");
  });

  it("rejects an unknown booking status", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id);
    const cls = await createClass();

    const { error } = await getSupabase()
      .from("bookings")
      .insert({ student_id: student.id, class_id: cls.id, status: "cancelled" });
    expect(error?.code).toBe("23514");
  });
});
