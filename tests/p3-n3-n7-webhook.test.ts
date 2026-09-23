import { beforeEach, describe, expect, it } from "vitest";
import { POST as postBooking } from "@/app/api/bookings/route";
import { POST as notify } from "@/app/api/payments/midtrans/notification/route";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";
import { signedNotification, startPayment } from "./helpers/midtrans";
import { bookingStatus, confirmedCount, rosterNames } from "./helpers/state";

function send(notification: object) {
  return notify(
    new Request("http://test/api/payments/midtrans/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    }),
  );
}

async function pendingBooking({ confirmedCount = 0, studentName = "Andi" } = {}) {
  const parent = await createParent();
  const student = await createStudent(parent.id, studentName);
  const cls = await createClass({ confirmedCount });
  const booking = await createBooking(student.id, cls.id);
  const orderId = await startPayment(booking.id);
  return { parent, student, cls, booking, orderId };
}

describe("Midtrans notifications", () => {
  beforeEach(resetDb);

  it("P3: a settlement confirms the booking and takes one seat", async () => {
    const { booking, cls, orderId } = await pendingBooking({ confirmedCount: 1 });

    const res = await send(signedNotification({ orderId }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "confirmed" });
    expect(await bookingStatus(booking.id)).toBe("confirmed");
    expect(await confirmedCount(cls.id)).toBe(2);
    expect(await rosterNames(cls.id)).toEqual(["Andi"]);
  });

  it("P3: a captured card counts as paid only when fraud_status is accept", async () => {
    const accepted = await pendingBooking();
    const challenged = await pendingBooking();

    await send(signedNotification({ orderId: accepted.orderId, transactionStatus: "capture", fraudStatus: "accept" }));
    await send(signedNotification({ orderId: challenged.orderId, transactionStatus: "capture", fraudStatus: "challenge" }));

    expect(await bookingStatus(accepted.booking.id)).toBe("confirmed");
    expect(await bookingStatus(challenged.booking.id)).toBe("pending_payment");
    expect(await confirmedCount(challenged.cls.id)).toBe(0);
  });

  it("N3: a successful payment for a full class is rejected, not overbooked", async () => {
    const { booking, cls, orderId } = await pendingBooking({ confirmedCount: 4, studentName: "Late" });

    const res = await send(signedNotification({ orderId }));

    expect(await res.json()).toEqual({ status: "rejected_class_full" });
    expect(await bookingStatus(booking.id)).toBe("rejected_class_full");
    expect(await confirmedCount(cls.id)).toBe(4);
    expect(await rosterNames(cls.id)).toEqual([]);
  });

  it.each(["deny", "cancel", "expire", "failure"])(
    "N4: %s fails the booking without touching the roster",
    async (transactionStatus) => {
      const { booking, cls, orderId } = await pendingBooking({ confirmedCount: 2 });

      const res = await send(signedNotification({ orderId, transactionStatus, statusCode: "202" }));

      expect(await res.json()).toEqual({ status: "payment_failed" });
      expect(await bookingStatus(booking.id)).toBe("payment_failed");
      expect(await confirmedCount(cls.id)).toBe(2);
      expect(await rosterNames(cls.id)).toEqual([]);
    },
  );

  it("N5: the parent can book again after a failed payment", async () => {
    const { parent, student, cls, booking, orderId } = await pendingBooking();
    await send(signedNotification({ orderId, transactionStatus: "deny", statusCode: "202" }));

    const res = await postBooking(
      new Request("http://test/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: parent.id, student_id: student.id, class_id: cls.id }),
      }),
    );

    expect(res.status).toBe(201);
    const { booking: retry } = await res.json();
    expect(retry.status).toBe("pending_payment");
    expect(retry.id).not.toBe(booking.id);
  });

  it("N6: the same notification sent twice is processed once", async () => {
    const { booking, cls, orderId } = await pendingBooking({ confirmedCount: 1 });
    const notification = signedNotification({ orderId });

    await send(notification);
    const second = await send(notification);

    expect(await second.json()).toEqual({ status: "confirmed" });
    expect(await bookingStatus(booking.id)).toBe("confirmed");
    expect(await confirmedCount(cls.id)).toBe(2);
  });

  it("N6: a capture followed by a settlement takes only one seat", async () => {
    const { cls, orderId } = await pendingBooking({ confirmedCount: 1 });

    await send(signedNotification({ orderId, transactionStatus: "capture", fraudStatus: "accept" }));
    await send(signedNotification({ orderId, transactionStatus: "settlement" }));

    expect(await confirmedCount(cls.id)).toBe(2);
  });

  it("N7: an invalid signature is rejected with 401 and changes nothing", async () => {
    const { booking, cls, orderId } = await pendingBooking({ confirmedCount: 1 });
    const forged = { ...signedNotification({ orderId }), signature_key: "f".repeat(128) };

    const res = await send(forged);

    expect(res.status).toBe(401);
    expect(await bookingStatus(booking.id)).toBe("pending_payment");
    expect(await confirmedCount(cls.id)).toBe(1);
  });

  it("N7: a notification with a tampered amount is rejected", async () => {
    const { booking, orderId } = await pendingBooking();
    const tampered = { ...signedNotification({ orderId }), gross_amount: "1000.00" };

    const res = await send(tampered);

    expect(res.status).toBe(401);
    expect(await bookingStatus(booking.id)).toBe("pending_payment");
  });

  it("answers 200 for a pending notification and leaves the booking alone", async () => {
    const { booking, orderId } = await pendingBooking();

    const res = await send(signedNotification({ orderId, transactionStatus: "pending", statusCode: "201" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: true });
    expect(await bookingStatus(booking.id)).toBe("pending_payment");
  });

  it("answers 200 for an order_id it does not know, so Midtrans stops retrying", async () => {
    const res = await send(signedNotification({ orderId: "order-that-no-longer-exists" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: true, reason: "unknown order_id" });
  });

  it("rejects a body that is not a notification with 400", async () => {
    expect((await send({ hello: "world" })).status).toBe(400);
  });
});
