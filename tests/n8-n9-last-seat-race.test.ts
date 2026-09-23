import { beforeEach, describe, expect, it } from "vitest";
import { POST as notify } from "@/app/api/payments/midtrans/notification/route";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";
import { signedNotification, startPayment } from "./helpers/midtrans";
import { bookingStatus, confirmedCount, rosterNames } from "./helpers/state";

function paid(orderId: string) {
  return notify(
    new Request("http://test/api/payments/midtrans/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signedNotification({ orderId })),
    }),
  );
}

// One seat left, two parents on the payment page. Neither holds the seat.
async function twoRivalsForTheLastSeat() {
  const parent = await createParent();
  const [userA, userB] = await Promise.all([
    createStudent(parent.id, "A"),
    createStudent(parent.id, "B"),
  ]);
  const cls = await createClass({ confirmedCount: 3 });
  const [bookingA, bookingB] = await Promise.all([
    createBooking(userA.id, cls.id),
    createBooking(userB.id, cls.id),
  ]);
  const [orderA, orderB] = await Promise.all([startPayment(bookingA.id), startPayment(bookingB.id)]);
  return { cls, bookingA, bookingB, orderA, orderB };
}

describe("last seat race", () => {
  beforeEach(resetDb);

  it("N8: B pays first, so A is rejected instead of overbooking the class", async () => {
    const { cls, bookingA, bookingB, orderA, orderB } = await twoRivalsForTheLastSeat();

    await paid(orderB);
    await paid(orderA);

    expect(await bookingStatus(bookingB.id)).toBe("confirmed");
    expect(await bookingStatus(bookingA.id)).toBe("rejected_class_full");
    expect(await confirmedCount(cls.id)).toBe(4);
    expect(await rosterNames(cls.id)).toEqual(["B"]);
  });

  it("N9: two notifications at the same time produce exactly one winner", async () => {
    const { cls, bookingA, bookingB, orderA, orderB } = await twoRivalsForTheLastSeat();

    await Promise.all([paid(orderA), paid(orderB)]);

    const statuses = [await bookingStatus(bookingA.id), await bookingStatus(bookingB.id)].sort();
    expect(statuses).toEqual(["confirmed", "rejected_class_full"]);
    expect(await confirmedCount(cls.id)).toBe(4);
    expect(await rosterNames(cls.id)).toHaveLength(1);
  });

  it("N9: four payments for one free seat still confirm only one", async () => {
    const parent = await createParent();
    const students = await Promise.all(
      ["A", "B", "C", "D"].map((name) => createStudent(parent.id, name)),
    );
    const cls = await createClass({ confirmedCount: 3 });
    const bookings = [];
    for (const s of students) bookings.push(await createBooking(s.id, cls.id));
    const orders = await Promise.all(bookings.map((b) => startPayment(b.id)));

    await Promise.all(orders.map(paid));

    const statuses = await Promise.all(bookings.map((b) => bookingStatus(b.id)));
    expect(statuses.filter((s) => s === "confirmed")).toHaveLength(1);
    expect(statuses.filter((s) => s === "rejected_class_full")).toHaveLength(3);
    expect(await confirmedCount(cls.id)).toBe(4);
  });
});
