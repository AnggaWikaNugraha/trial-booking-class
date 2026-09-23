"use client";

import Script from "next/script";
import type { Parent } from "@/lib/data/list-parents";
import { Button } from "../primitive/button";
import { FormFieldGroup } from "../primitive/form-field-group";
import { Select } from "../primitive/select";
import { ClassList } from "./class-list";
import { useBookingSelection } from "./hooks/use-booking-selection";
import { useClasses } from "./hooks/use-classes";
import { useCreateBooking } from "./hooks/use-create-booking";
import { usePayBooking } from "./hooks/use-pay-booking";
import { useStudents } from "./hooks/use-students";

export function BookingForm({ parents }: { parents: Parent[] }) {
  const { booking, submitting, error: bookingError, createBooking, clearResult } =
    useCreateBooking();
  const { paying, outcome, error: payError, payBooking, clearPayment } = usePayBooking();
  const { parentId, studentId, classId, chooseParent, chooseStudent, chooseClass } =
    useBookingSelection({
      onChange: () => {
        clearResult();
        clearPayment();
      },
    });
  const { students, loading: studentsLoading, error: studentsError } = useStudents(parentId);
  const { classes, loading: classesLoading, error: classesError } = useClasses();
  const loadError = studentsError ?? classesError;
  const canSubmit = Boolean(parentId && studentId && classId) && !submitting;

  return (
    <div className="mt-8 space-y-6">
      {loadError && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

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

      <ClassList classes={classes} loading={classesLoading} value={classId} onChange={chooseClass} />

      <Button disabled={!canSubmit} onClick={() => createBooking({ parentId, studentId, classId })}>
        {submitting ? "Booking..." : "Book trial class"}
      </Button>

      {bookingError && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{bookingError}</p>
      )}
      {booking && (
        <div className="space-y-3 rounded bg-green-50 p-3 text-sm text-green-800">
          <p>
            Booking created. Status: <code>{booking.status}</code>. The seat is not held until
            payment is confirmed.
          </p>
          {outcome !== "submitted" && (
            <Button onClick={() => payBooking(booking.id)} disabled={paying}>
              {paying ? "Opening payment..." : "Pay now"}
            </Button>
          )}
        </div>
      )}
      {outcome === "submitted" && (
        <p className="rounded bg-blue-50 p-3 text-sm text-blue-800">
          Payment sent to Midtrans. Your booking is confirmed once Midtrans notifies us.
        </p>
      )}
      {outcome === "failed" && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">Payment failed. You can try again.</p>
      )}
      {outcome === "closed" && (
        <p className="rounded bg-neutral-100 p-3 text-sm text-neutral-700">
          Payment window closed. You can pay again with the button above.
        </p>
      )}
      {payError && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{payError}</p>}

      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />
    </div>
  );
}
