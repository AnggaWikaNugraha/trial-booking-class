import { useEffect, useState } from "react";
import type { BookingDetail } from "@/lib/data/get-booking";

const POLL_MS = 3000;
const FINAL_STATUSES = ["confirmed", "payment_failed", "rejected_class_full"];

// The webhook decides the booking status, and it can arrive seconds after the
// parent closes the Midtrans popup. Poll until the status is final.
export function useBookingStatus(initial: BookingDetail) {
  const [booking, setBooking] = useState(initial);
  const waiting = !FINAL_STATUSES.includes(booking.status);

  useEffect(() => {
    if (!waiting) return;
    let ignore = false;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${initial.id}`);
        if (!res.ok) return;
        const body = await res.json();
        if (!ignore) setBooking(body.booking);
      } catch {
        // A failed poll is not worth showing; the next one may succeed.
      }
    }, POLL_MS);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [initial.id, waiting]);

  return { booking, waiting };
}
