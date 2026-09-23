import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Card } from "@/app/_components/primitive/card";
import { SeatMeter } from "@/app/_components/primitive/seat-meter";
import { getClassRoster } from "@/lib/data/get-class-roster";
import { isUuid } from "@/lib/http";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function RosterPage({ params }: PageProps<"/classes/[id]/roster">) {
  await connection();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const roster = await getClassRoster(id);
  if (!roster) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{roster.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            {dateFormat.format(new Date(roster.starts_at))}
          </p>
        </div>
        <SeatMeter capacity={roster.capacity} taken={roster.confirmed_count} />
      </div>

      <div className="mt-6">
        <Card
          title="Confirmed students"
          description="Bookings that failed payment, or that paid after the class filled up, are not listed."
        >
          {roster.students.length === 0 ? (
            <p className="text-sm text-muted">No confirmed students yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-border">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Grade</th>
                  <th className="pb-2 font-medium">Parent</th>
                  <th className="pb-2 font-medium">Confirmed at</th>
                </tr>
              </thead>
              <tbody>
                {roster.students.map((s) => (
                  <tr key={s.booking_id} className="border-b border-border last:border-0">
                    <td className="py-2">{s.student_name}</td>
                    <td className="py-2 text-muted">{s.grade}</td>
                    <td className="py-2 text-muted">{s.parent_name}</td>
                    <td className="py-2 text-muted">
                      {dateFormat.format(new Date(s.confirmed_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Link className="mt-6 inline-block text-sm underline" href="/classes">
        All rosters
      </Link>
    </main>
  );
}
