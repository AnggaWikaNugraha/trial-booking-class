import { connection } from "next/server";
import { listParents } from "@/lib/data";
import { BookingForm } from "./_components/booking-form/booking-form";

export default async function Home() {
  // Read the database per request, not once at build time.
  await connection();
  const parents = await listParents();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Book a trial class</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Choose your child and a class. Each trial class has 4 seats.
      </p>
      <BookingForm parents={parents} />
    </main>
  );
}
