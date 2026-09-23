import { connection } from "next/server";
import { listParents } from "@/lib/data/list-parents";
import { BookingForm } from "./_components/booking-form/booking-form";
import { PendingBookings } from "./_components/pending-bookings/pending-bookings";

export default async function Home() {
  // Read the database per request, not once at build time.
  await connection();
  const parents = await listParents();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Book a trial class</h1>
      <p className="mt-1 text-sm text-muted">
        Pick a child and a class, then pay. A seat is taken only when the payment is confirmed.
      </p>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <BookingForm parents={parents} />
        <aside className="lg:sticky lg:top-6">
          <PendingBookings />
        </aside>
      </div>
    </main>
  );
}
