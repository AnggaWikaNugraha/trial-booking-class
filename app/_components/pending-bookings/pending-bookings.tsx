import { listPendingBookings } from "@/lib/data/list-pending-bookings";
import { Card } from "../primitive/card";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export async function PendingBookings() {
  const bookings = await listPendingBookings();

  return (
    <Card
      title="Awaiting payment"
      description="These bookings hold no seat. The seat goes to whoever pays first."
    >
      {bookings.length === 0 ? (
        <p className="text-sm text-muted">Nobody is waiting to pay right now.</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {bookings.map((b) => (
            <li key={b.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <p className="font-medium">{b.student_name}</p>
              <p className="text-muted">{b.class_subject}</p>
              <p className="text-xs text-muted">
                {b.parent_name} · {dateFormat.format(new Date(b.created_at))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
