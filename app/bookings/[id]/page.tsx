import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BookingStatus } from "@/app/_components/booking-status/booking-status";
import { getBooking } from "@/lib/data/get-booking";
import { isUuid } from "@/lib/http";

export default async function BookingPage({ params }: PageProps<"/bookings/[id]">) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const booking = await getBooking(id);
  if (!booking) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Booking status</h1>
      <p className="mt-1 text-xs text-muted">Booking {booking.id}</p>
      <div className="mt-6">
        <BookingStatus initial={booking} />
      </div>
    </main>
  );
}
