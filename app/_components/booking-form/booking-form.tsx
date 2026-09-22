"use client";

import type { Parent } from "@/lib/data/list-parents";
import { Button } from "../primitive/button";
import { FormFieldGroup } from "../primitive/form-field-group";
import { Select } from "../primitive/select";
import { ClassList } from "./class-list";
import { useBookingSelection } from "./hooks/use-booking-selection";
import { useClasses } from "./hooks/use-classes";
import { useCreateBooking } from "./hooks/use-create-booking";
import { useStudents } from "./hooks/use-students";

export function BookingForm({ parents }: { parents: Parent[] }) {
  const { booking, submitting, error: bookingError, createBooking, clearResult } =
    useCreateBooking();
  const { parentId, studentId, classId, chooseParent, chooseStudent, chooseClass } =
    useBookingSelection({ onChange: clearResult });
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
        <p className="rounded bg-green-50 p-3 text-sm text-green-800">
          Booking created. Status: <code>{booking.status}</code>
        </p>
      )}
    </div>
  );
}
