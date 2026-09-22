import { listPendingBookings } from "@/lib/data/list-pending-bookings";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export async function PendingBookings() {
  const bookings = await listPendingBookings();

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold">Awaiting payment</h2>
      <p className="mt-1 text-sm text-neutral-500">
        These bookings do not hold a seat yet. The seat goes to whoever pays first.
      </p>
      {bookings.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No bookings awaiting payment.</p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-neutral-300 text-neutral-500">
            <tr>
              <th className="py-2 font-medium">Child</th>
              <th className="py-2 font-medium">Parent</th>
              <th className="py-2 font-medium">Class</th>
              <th className="py-2 font-medium">Booked at</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-neutral-200">
                <td className="py-2">{b.student_name}</td>
                <td className="py-2">{b.parent_name}</td>
                <td className="py-2">{b.class_subject}</td>
                <td className="py-2">{dateFormat.format(new Date(b.created_at))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
