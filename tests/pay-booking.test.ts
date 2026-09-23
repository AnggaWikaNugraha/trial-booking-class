import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as payBooking } from "@/app/api/bookings/[id]/pay/route";
import { createSnapTransaction } from "@/lib/midtrans";
import { getSupabase } from "@/lib/supabase";
import { TRIAL_PRICE_IDR } from "@/lib/trial-price";
import { createBooking, createClass, createParent, createStudent, resetDb } from "./helpers/db";

// Midtrans is replaced so these tests check our side of the payment step
// without a network call or sandbox keys.
vi.mock("@/lib/midtrans", () => ({
  createSnapTransaction: vi.fn(async () => ({ token: "snap-token", redirect_url: "https://snap.test" })),
}));
const snap = vi.mocked(createSnapTransaction);

function pay(id: string) {
  return payBooking(new Request(`http://test/api/bookings/${id}/pay`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

async function attemptsFor(bookingId: string) {
  const { data, error } = await getSupabase()
    .from("payment_attempts")
    .select("order_id, gross_amount, provider_status")
    .eq("booking_id", bookingId);
  if (error) throw error;
  return data;
}

async function pendingBooking(status = "pending_payment") {
  const parent = await createParent();
  const student = await createStudent(parent.id);
  const cls = await createClass({ confirmedCount: 3 });
  return createBooking(student.id, cls.id, status);
}

describe("starting a Midtrans payment", () => {
  beforeEach(async () => {
    snap.mockClear();
    await resetDb();
  });

  it("creates a Snap transaction and records the payment attempt", async () => {
    const booking = await pendingBooking();

    const res = await pay(booking.id);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ token: "snap-token", redirect_url: "https://snap.test" });
    expect(body.order_id.length).toBeLessThanOrEqual(50);
    expect(snap).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: body.order_id, grossAmount: TRIAL_PRICE_IDR }),
    );
    expect(await attemptsFor(booking.id)).toEqual([
      { order_id: body.order_id, gross_amount: TRIAL_PRICE_IDR, provider_status: null },
    ]);
  });

  it("does not confirm the booking or take a seat", async () => {
    const booking = await pendingBooking();

    await pay(booking.id);

    const db = getSupabase();
    const { data: b } = await db.from("bookings").select("status").eq("id", booking.id).single();
    const { data: c } = await db.from("trial_classes").select("confirmed_count").eq("id", booking.class_id).single();
    expect(b?.status).toBe("pending_payment");
    expect(c?.confirmed_count).toBe(3);
  });

  it("uses a new order_id for every attempt", async () => {
    const booking = await pendingBooking();

    const first = await (await pay(booking.id)).json();
    const second = await (await pay(booking.id)).json();

    expect(first.order_id).not.toBe(second.order_id);
    expect(await attemptsFor(booking.id)).toHaveLength(2);
  });

  it("refuses to pay for a booking that is no longer pending with 409", async () => {
    const booking = await pendingBooking("confirmed");

    const res = await pay(booking.id);

    expect(res.status).toBe(409);
    expect(snap).not.toHaveBeenCalled();
    expect(await attemptsFor(booking.id)).toHaveLength(0);
  });

  it("returns 502 when Midtrans fails", async () => {
    const booking = await pendingBooking();
    snap.mockRejectedValueOnce(new Error("Midtrans Snap 500"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const res = await pay(booking.id);

    expect(res.status).toBe(502);
  });

  it("returns 404 for an unknown booking and 400 for a bad id", async () => {
    expect((await pay("40000000-0000-0000-0000-00000000dead")).status).toBe(404);
    expect((await pay("not-a-uuid")).status).toBe(400);
  });
});
