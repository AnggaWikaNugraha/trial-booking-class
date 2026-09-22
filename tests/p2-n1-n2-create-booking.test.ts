import { beforeEach, describe, expect, it } from "vitest";
import { POST as postBooking } from "@/app/api/bookings/route";
import { getSupabase } from "@/lib/supabase";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";

function book(body: unknown) {
  return postBooking(
    new Request("http://test/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function bookingsFor(studentId: string, classId: string) {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("class_id", classId);
  if (error) throw error;
  return data;
}

async function setup({ confirmedCount = 0 } = {}) {
  const parent = await createParent();
  const student = await createStudent(parent.id);
  const cls = await createClass({ confirmedCount });
  return { parent, student, cls };
}

describe("creating a booking", () => {
  beforeEach(resetDb);

  it("P2: creates a pending_payment booking", async () => {
    const { parent, student, cls } = await setup();

    const res = await book({ parent_id: parent.id, student_id: student.id, class_id: cls.id });

    expect(res.status).toBe(201);
    const { booking } = await res.json();
    expect(booking).toMatchObject({ student_id: student.id, class_id: cls.id, status: "pending_payment" });
    expect(await bookingsFor(student.id, cls.id)).toHaveLength(1);
  });

  it("P2: does not take a seat before payment", async () => {
    const { parent, student, cls } = await setup({ confirmedCount: 3 });

    await book({ parent_id: parent.id, student_id: student.id, class_id: cls.id });

    const { data } = await getSupabase().from("trial_classes").select("confirmed_count").eq("id", cls.id).single();
    expect(data?.confirmed_count).toBe(3);
  });

  it("N1: rejects a duplicate booking for the same child and class with 409", async () => {
    const { parent, student, cls } = await setup();
    const body = { parent_id: parent.id, student_id: student.id, class_id: cls.id };
    await book(body);

    const res = await book(body);

    expect(res.status).toBe(409);
    expect(await bookingsFor(student.id, cls.id)).toHaveLength(1);
  });

  it("N1: rejects a booking when the child is already confirmed in the class", async () => {
    const { parent, student, cls } = await setup();
    await createBooking(student.id, cls.id, "confirmed");

    const res = await book({ parent_id: parent.id, student_id: student.id, class_id: cls.id });

    expect(res.status).toBe(409);
    expect(await bookingsFor(student.id, cls.id)).toHaveLength(1);
  });

  it("N2: stores only one booking when duplicates are sent at the same time", async () => {
    const { parent, student, cls } = await setup();
    const body = { parent_id: parent.id, student_id: student.id, class_id: cls.id };

    const responses = await Promise.all(Array.from({ length: 5 }, () => book(body)));

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(await bookingsFor(student.id, cls.id)).toHaveLength(1);
  });

  it("rejects a child that belongs to another parent with 403", async () => {
    const { student, cls } = await setup();
    const otherParent = await createParent();

    const res = await book({ parent_id: otherParent.id, student_id: student.id, class_id: cls.id });

    expect(res.status).toBe(403);
    expect(await bookingsFor(student.id, cls.id)).toHaveLength(0);
  });

  it("rejects a class that is already full with 409", async () => {
    const { parent, student, cls } = await setup({ confirmedCount: 4 });

    const res = await book({ parent_id: parent.id, student_id: student.id, class_id: cls.id });

    expect(res.status).toBe(409);
    expect(await bookingsFor(student.id, cls.id)).toHaveLength(0);
  });

  it("returns 404 for an unknown class", async () => {
    const { parent, student } = await setup();

    const res = await book({
      parent_id: parent.id,
      student_id: student.id,
      class_id: "30000000-0000-0000-0000-00000000dead",
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 for a missing or malformed body", async () => {
    expect((await book({})).status).toBe(400);
    expect((await book({ parent_id: "x", student_id: "y", class_id: "z" })).status).toBe(400);
  });
});
