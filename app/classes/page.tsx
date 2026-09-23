import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/app/_components/primitive/card";
import { SeatMeter } from "@/app/_components/primitive/seat-meter";
import { listClasses } from "@/lib/data/list-classes";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function ClassesPage() {
  await connection();
  const classes = await listClasses();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Class rosters</h1>
      <p className="mt-1 text-sm text-muted">
        What an admin or teacher sees before class: confirmed students only.
      </p>

      <div className="mt-6 space-y-3">
        {classes.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link href={`/classes/${c.id}/roster`} className="font-medium underline">
                  {c.subject}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {dateFormat.format(new Date(c.starts_at))}
                </p>
              </div>
              <SeatMeter capacity={c.capacity} taken={c.confirmed_count} />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
