import { beforeEach, describe, expect, it } from "vitest";
import { GET as getBooking } from "@/app/api/bookings/[id]/route";
import { POST as notify } from "@/app/api/payments/midtrans/notification/route";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";
import { signedNotification, startPayment } from "./helpers/midtrans";

function status(id: string) {
  return getBooking(new Request(`http://test/api/bookings/${id}`), {
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

describe("P4: seeing the booking status after submitting", () => {
  beforeEach(resetDb);

  it("shows the booking waiting for payment, with the class and child", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id, "Andi");
    const cls = await createClass({ subject: "Science Trial A" });
    const booking = await createBooking(student.id, cls.id);

    const res = await status(booking.id);

    expect(res.status).toBe(200);
    const { booking: detail } = await res.json();
    expect(detail).toMatchObject({
      id: booking.id,
      status: "pending_payment",
      student_name: "Andi",
      parent_name: parent.name,
      class_subject: "Science Trial A",
      payment_status: null,
    });
  });

  it("follows the booking through payment until it is confirmed", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id);
    const cls = await createClass({ confirmedCount: 1 });
    const booking = await createBooking(student.id, cls.id);
    const orderId = await startPayment(booking.id);

    const beforeWebhook = await (await status(booking.id)).json();
    await send(signedNotification({ orderId }));
    const afterWebhook = await (await status(booking.id)).json();

    expect(beforeWebhook.booking).toMatchObject({ status: "pending_payment", payment_status: null });
    expect(afterWebhook.booking).toMatchObject({ status: "confirmed", payment_status: "settlement" });
  });

  it("shows a failed payment as payment_failed", async () => {
    const parent = await createParent();
    const student = await createStudent(parent.id);
    const cls = await createClass();
    const booking = await createBooking(student.id, cls.id);
    const orderId = await startPayment(booking.id);
    await send(signedNotification({ orderId, transactionStatus: "deny", statusCode: "202" }));

    const { booking: detail } = await (await status(booking.id)).json();

    expect(detail).toMatchObject({ status: "payment_failed", payment_status: "deny" });
  });

  it("returns 404 for an unknown booking and 400 for a bad id", async () => {
    expect((await status("40000000-0000-0000-0000-00000000dead")).status).toBe(404);
    expect((await status("not-a-uuid")).status).toBe(400);
  });
});
