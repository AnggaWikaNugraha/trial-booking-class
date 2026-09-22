import { beforeEach, describe, expect, it } from "vitest";
import { GET as getClasses } from "@/app/api/classes/route";
import { GET as getStudents } from "@/app/api/parents/[id]/students/route";
import { listPendingBookings } from "@/lib/data/list-pending-bookings";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";

function studentsOf(id: string) {
  return getStudents(new Request(`http://test/api/parents/${id}/students`), {
    params: Promise.resolve({ id }),
  });
}

describe("P1: parent chooses a child and an available class", () => {
  beforeEach(resetDb);

  it("lists only the chosen parent's children", async () => {
    const parent = await createParent();
    const other = await createParent();
    await createStudent(parent.id, "Andi");
    await createStudent(parent.id, "Bella");
    await createStudent(other.id, "Dimas");

    const res = await studentsOf(parent.id);

    expect(res.status).toBe(200);
    const { students } = await res.json();
    expect(students.map((s: { name: string }) => s.name)).toEqual(["Andi", "Bella"]);
  });

  it("lists classes with remaining seats", async () => {
    await createClass({ subject: "Open", confirmedCount: 1 });
    await createClass({ subject: "Last seat", confirmedCount: 3 });
    await createClass({ subject: "Full", confirmedCount: 4 });

    const res = await getClasses();

    expect(res.status).toBe(200);
    const { classes } = await res.json();
    const seats = Object.fromEntries(
      classes.map((c: { subject: string; remaining_seats: number }) => [c.subject, c.remaining_seats]),
    );
    expect(seats).toEqual({ Open: 3, "Last seat": 1, Full: 0 });
  });

  it("lists who is awaiting payment, without taking seats", async () => {
    const parent = await createParent();
    const [a, b, c] = await Promise.all([
      createStudent(parent.id, "A"),
      createStudent(parent.id, "B"),
      createStudent(parent.id, "C"),
    ]);
    const cls = await createClass({ subject: "Last seat", confirmedCount: 3 });
    await createBooking(a.id, cls.id, "pending_payment");
    await createBooking(b.id, cls.id, "pending_payment");
    await createBooking(c.id, cls.id, "payment_failed");

    const pending = await listPendingBookings();
    const { classes } = await (await getClasses()).json();

    expect(pending.map((p) => [p.student_name, p.class_subject]).sort()).toEqual([
      ["A", "Last seat"],
      ["B", "Last seat"],
    ]);
    expect(classes[0].remaining_seats).toBe(1);
  });

  it("returns 404 for an unknown parent", async () => {
    const res = await studentsOf("10000000-0000-0000-0000-00000000dead");
    expect(res.status).toBe(404);
  });

  it("returns 400 for an id that is not a uuid", async () => {
    const res = await studentsOf("not-a-uuid");
    expect(res.status).toBe(400);
  });
});
