import { beforeEach, describe, expect, it } from "vitest";
import { POST as resetDemo } from "@/app/api/demo/reset/route";
import { getSupabase } from "@/lib/supabase";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";

describe("reset demo data", () => {
  beforeEach(resetDb);

  it("removes test bookings and restores the seed", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id);
    const cls = await createClass();
    await createBooking(student.id, cls.id);

    const res = await resetDemo();

    expect(res.status).toBe(200);
    const db = getSupabase();
    const { data: classes } = await db
      .from("trial_classes")
      .select("subject, confirmed_count")
      .order("subject");
    expect(classes).toEqual([
      { subject: "Math Trial B", confirmed_count: 3 },
      { subject: "Science Trial A", confirmed_count: 1 },
      { subject: "Science Trial C", confirmed_count: 4 },
    ]);
    const { data: bookings } = await db.from("bookings").select("status");
    expect(bookings).toHaveLength(8);
    expect(bookings?.every((b) => b.status === "confirmed")).toBe(true);
    const { count: students } = await db.from("students").select("*", { count: "exact", head: true });
    expect(students).toBe(6);
  });
});
