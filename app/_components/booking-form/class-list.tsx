import type { TrialClass } from "@/lib/data/list-classes";
import { Input } from "../primitive/input";

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
  return (
    <fieldset>
      <legend className="text-sm font-medium">Trial class</legend>
      {loading && <p className="mt-2 text-sm text-neutral-500">Loading classes...</p>}
      <div className="mt-2 space-y-2">
        {classes.map((c) => {
          const full = c.remaining_seats <= 0;
          return (
            <label
              key={c.id}
              className={`flex items-center justify-between gap-4 rounded border p-3 ${
                value === c.id ? "border-blue-600" : "border-neutral-300"
              } ${full ? "opacity-50" : "cursor-pointer"}`}
            >
              <span className="flex items-center gap-3">
                <Input
                  type="radio"
                  name="class"
                  value={c.id}
                  checked={value === c.id}
                  onChange={() => onChange(c.id)}
                  disabled={full}
                />
                <span>
                  <span className="block font-medium">{c.subject}</span>
                  <span className="block text-sm text-neutral-500">
                    {dateFormat.format(new Date(c.starts_at))}
                  </span>
                </span>
              </span>
              <span className="text-sm">
                {full ? "Full" : `${c.remaining_seats} of ${c.capacity} seats left`}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
