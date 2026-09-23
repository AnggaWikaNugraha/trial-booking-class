"use client";

import Link from "next/link";
import Script from "next/script";
import type { Parent } from "@/lib/data/list-parents";
import { Badge } from "../primitive/badge";
import { Button } from "../primitive/button";
import { Card } from "../primitive/card";
import { FormFieldGroup } from "../primitive/form-field-group";
import { Select } from "../primitive/select";
import { ClassList } from "./class-list";
import { useBookingSelection } from "./hooks/use-booking-selection";
import { useClasses } from "./hooks/use-classes";
import { useCreateBooking } from "./hooks/use-create-booking";
import { usePayBooking } from "./hooks/use-pay-booking";
import { useStudents } from "./hooks/use-students";

const PAYMENT_MESSAGE = {
  submitted: {
    tone: "info" as const,
    text: "Payment sent to Midtrans. Your booking is confirmed once Midtrans notifies us. Taking you to the booking status...",
  },
  failed: { tone: "danger" as const, text: "The payment failed. You can try again." },
  closed: { tone: "neutral" as const, text: "Payment window closed. You can pay again." },
};

export function BookingForm({ parents }: { parents: Parent[] }) {
  const { classes, loading: classesLoading, error: classesError, reload: reloadClasses } =
    useClasses();
  const { booking, submitting, error: bookingError, createBooking, clearResult } =
    useCreateBooking({ onBooked: reloadClasses });
  const { paying, outcome, error: payError, payBooking, clearPayment } = usePayBooking({
    onFinished: reloadClasses,
  });
  const { parentId, studentId, classId, chooseParent, chooseStudent, chooseClass } =
    useBookingSelection({
      onChange: () => {
        clearResult();
        clearPayment();
      },
    });
  const { students, loading: studentsLoading, error: studentsError } = useStudents(parentId);

  const loadError = studentsError ?? classesError;
  const canSubmit = Boolean(parentId && studentId && classId) && !submitting;
  const payment = outcome ? PAYMENT_MESSAGE[outcome] : null;

  return (
    <div className="space-y-4">
      {loadError && (
        <p className="rounded-lg bg-danger-surface p-3 text-sm text-danger">{loadError}</p>
      )}

      <Card step={1} title="Who is joining?" description="There is no login in this demo, so pick a parent to act as.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormFieldGroup label="Parent">
            <Select
              options={parents.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Choose a parent"
              value={parentId}
              onChange={chooseParent}
            />
          </FormFieldGroup>
          <FormFieldGroup label="Child">
            <Select
              options={students.map((s) => ({ value: s.id, label: `${s.name} (grade ${s.grade})` }))}
              placeholder={studentsLoading ? "Loading..." : "Choose a child"}
              value={studentId}
              onChange={chooseStudent}
              disabled={!parentId || studentsLoading}
            />
          </FormFieldGroup>
        </div>
      </Card>

      <Card
        step={2}
        title="Pick a trial class"
        description="Every class holds 4 students. Seats shown here are a hint, not a reservation."
      >
        <ClassList classes={classes} loading={classesLoading} value={classId} onChange={chooseClass} />
      </Card>

      <Card step={3} title="Confirm and pay">
        {!booking && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={!canSubmit}
              onClick={() => createBooking({ parentId, studentId, classId })}
            >
              {submitting ? "Booking..." : "Book trial class"}
            </Button>
            <span className="text-sm text-muted">
              The seat is only taken once the payment is confirmed.
            </span>
          </div>
        )}

        {bookingError && (
          <p className="rounded-lg bg-danger-surface p-3 text-sm text-danger">{bookingError}</p>
        )}

        {booking && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="neutral">{booking.status}</Badge>
              <span className="text-sm text-muted">Booking created.</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {outcome !== "submitted" && (
                <Button onClick={() => payBooking(booking.id)} disabled={paying}>
                  {paying ? "Opening payment..." : "Pay now"}
                </Button>
              )}
              <Link className="text-sm underline" href={`/bookings/${booking.id}`}>
                View booking status
              </Link>
            </div>
            {payment && (
              <p className={`rounded-lg p-3 text-sm ${toneClass(payment.tone)}`}>{payment.text}</p>
            )}
            {payError && (
              <p className="rounded-lg bg-danger-surface p-3 text-sm text-danger">{payError}</p>
            )}
          </div>
        )}
      </Card>

      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />
    </div>
  );
}

function toneClass(tone: "info" | "danger" | "neutral") {
  if (tone === "info") return "bg-info-surface text-info";
  if (tone === "danger") return "bg-danger-surface text-danger";
  return "bg-surface-muted text-muted";
}
