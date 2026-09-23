"use client";

import Link from "next/link";
import type { BookingDetail } from "@/lib/data/get-booking";
import { Badge } from "../primitive/badge";
import { Card } from "../primitive/card";
import { BookingTimeline } from "./booking-timeline";
import { useBookingStatus } from "./hooks/use-booking-status";
import { STATUS_COPY } from "./status-copy";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function BookingStatus({ initial }: { initial: BookingDetail }) {
  const { booking, waiting } = useBookingStatus(initial);
  const copy = STATUS_COPY[booking.status];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={copy.tone}>{copy.label}</Badge>
          <code className="text-xs text-muted">{booking.status}</code>
        </div>
        <p className="mt-3 text-sm">{copy.detail}</p>
        {waiting && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Checking with Midtrans every few seconds...
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Child</dt>
            <dd>{booking.student_name}</dd>
            <dt className="text-muted">Parent</dt>
            <dd>{booking.parent_name}</dd>
            <dt className="text-muted">Class</dt>
            <dd>{booking.class_subject}</dd>
            <dt className="text-muted">Starts</dt>
            <dd>{dateFormat.format(new Date(booking.class_starts_at))}</dd>
          </dl>
        </Card>
        <Card title="Progress">
          <BookingTimeline
            status={booking.status}
            createdAt={booking.created_at}
            updatedAt={booking.updated_at}
            paymentStatus={booking.payment_status}
          />
        </Card>
      </div>

      <div className="flex gap-4 text-sm">
        <Link className="underline" href="/">
          Back to booking
        </Link>
        <Link className="underline" href={`/classes/${booking.class_id}/roster`}>
          Class roster
        </Link>
      </div>
    </div>
  );
}
