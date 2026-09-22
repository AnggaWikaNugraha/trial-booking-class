import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Booking } from "@/lib/data/create-booking";

type Input = { parentId: string; studentId: string; classId: string };

export function useCreateBooking() {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBooking({ parentId, studentId, classId }: Input) {
    setSubmitting(true);
    setError(null);
    setBooking(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: parentId, student_id: studentId, class_id: classId }),
      });
      const body = await res.json();
      if (!res.ok) return setError(body.error ?? "Could not create the booking");
      setBooking(body.booking);
      // Re-render the server sections, such as the list awaiting payment.
      router.refresh();
    } catch {
      setError("Could not create the booking");
    } finally {
      setSubmitting(false);
    }
  }

  // The message describes the last submission, so it goes away once the
  // selection changes.
  function clearResult() {
    setBooking(null);
    setError(null);
  }

  return { booking, submitting, error, createBooking, clearResult };
}
