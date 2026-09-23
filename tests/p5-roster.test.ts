import { beforeEach, describe, expect, it } from "vitest";
import { GET as getRoster } from "@/app/api/classes/[id]/roster/route";
import { POST as notify } from "@/app/api/payments/midtrans/notification/route";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";
import { signedNotification, startPayment } from "./helpers/midtrans";

function roster(id: string) {
  return getRoster(new Request(`http://test/api/classes/${id}/roster`), {
    params: Promise.resolve({ id }),
  });
}

function send(notification: object) {
  return notify(
    new Request("http://test/api/payments/midtrans/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    }),
  );
}

describe("P5: the class roster an admin or teacher sees", () => {
  beforeEach(resetDb);

  it("lists confirmed students only", async () => {
    const parent = await createParent();
    const cls = await createClass({ subject: "Science Trial A", confirmedCount: 0 });
    const [paid, waiting, failed] = await Promise.all([
      createStudent(parent.id, "Confirmed Child"),
      createStudent(parent.id, "Still Paying"),
      createStudent(parent.id, "Payment Failed"),
    ]);
    const paidBooking = await createBooking(paid.id, cls.id);
    await createBooking(waiting.id, cls.id);
    const failedBooking = await createBooking(failed.id, cls.id);
    await send(signedNotification({ orderId: await startPayment(paidBooking.id) }));
    await send(
      signedNotification({
        orderId: await startPayment(failedBooking.id),
        transactionStatus: "deny",
        statusCode: "202",
      }),
    );

    const res = await roster(cls.id);

    expect(res.status).toBe(200);
    const { roster: body } = await res.json();
    expect(body).toMatchObject({
      subject: "Science Trial A",
      capacity: 4,
      confirmed_count: 1,
      remaining_seats: 3,
    });
    expect(body.students.map((s: { student_name: string }) => s.student_name)).toEqual([
      "Confirmed Child",
    ]);
    expect(body.students[0]).toMatchObject({ parent_name: parent.name, grade: 3 });
  });

  it("leaves out a booking that paid after the class filled up", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id, "Too Late");
    const cls = await createClass({ confirmedCount: 4 });
    const booking = await createBooking(student.id, cls.id);
    await send(signedNotification({ orderId: await startPayment(booking.id) }));

    const { roster: body } = await (await roster(cls.id)).json();

    expect(body.students).toEqual([]);
    expect(body.confirmed_count).toBe(4);
  });

  it("returns an empty roster for a class nobody booked", async () => {
    const cls = await createClass();

    const { roster: body } = await (await roster(cls.id)).json();

    expect(body.students).toEqual([]);
    expect(body.remaining_seats).toBe(4);
  });

  it("returns 404 for an unknown class and 400 for a bad id", async () => {
    expect((await roster("30000000-0000-0000-0000-00000000dead")).status).toBe(404);
    expect((await roster("not-a-uuid")).status).toBe(400);
  });
});
