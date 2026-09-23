import { Input } from "../primitive/input";
import { SeatMeter } from "../primitive/seat-meter";
import { Skeleton } from "../primitive/skeleton";
import type { TrialClass } from "@/lib/data/list-classes";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

type Props = {
  classes: TrialClass[];
  loading: boolean;
  value: string;
  onChange: (classId: string) => void;
};

export function ClassList({ classes, loading, value, onChange }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {classes.map((c) => {
        const full = c.remaining_seats <= 0;
        const selected = value === c.id;
        return (
          <label
            key={c.id}
            className={`flex items-center justify-between gap-4 rounded-lg border p-4 transition ${
              selected ? "border-primary bg-info-surface" : "border-border"
            } ${full ? "opacity-60" : "cursor-pointer hover:border-primary"}`}
          >
            <span className="flex items-center gap-3">
              <Input
                type="radio"
                name="class"
                value={c.id}
                checked={selected}
                onChange={() => onChange(c.id)}
                disabled={full}
              />
              <span>
                <span className="block font-medium">{c.subject}</span>
                <span className="block text-sm text-muted">
                  {dateFormat.format(new Date(c.starts_at))}
                </span>
              </span>
            </span>
            <SeatMeter capacity={c.capacity} taken={c.confirmed_count} />
          </label>
        );
      })}
    </div>
  );
}
