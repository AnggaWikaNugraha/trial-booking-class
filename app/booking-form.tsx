"use client";

import { useEffect, useState } from "react";
import type { Parent, Student, TrialClass } from "@/lib/data";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function BookingForm({ parents }: { parents: Parent[] }) {
  const [parentId, setParentId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [classes, setClasses] = useState<TrialClass[]>([]);
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((body) => setClasses(body.classes))
      .catch(() => setError("Could not load classes"));
  }, []);

  async function chooseParent(id: string) {
    setParentId(id);
    setStudentId("");
    setStudents([]);
    if (!id) return;
    const res = await fetch(`/api/parents/${id}/students`);
    if (!res.ok) return setError("Could not load children");
    setStudents((await res.json()).students);
  }

  return (
    <div className="mt-8 space-y-6">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <label className="block">
        <span className="text-sm font-medium">Parent</span>
        <select
          className="mt-1 block w-full rounded border border-neutral-300 bg-transparent p-2"
          value={parentId}
          onChange={(e) => chooseParent(e.target.value)}
        >
          <option value="">Choose a parent</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Child</span>
        <select
          className="mt-1 block w-full rounded border border-neutral-300 bg-transparent p-2 disabled:opacity-50"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          disabled={!parentId}
        >
          <option value="">Choose a child</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} (grade {s.grade})
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">Trial class</legend>
        <div className="mt-2 space-y-2">
          {classes.map((c) => {
            const full = c.remaining_seats <= 0;
            return (
              <label
                key={c.id}
                className={`flex items-center justify-between gap-4 rounded border p-3 ${
                  classId === c.id ? "border-blue-600" : "border-neutral-300"
                } ${full ? "opacity-50" : "cursor-pointer"}`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="class"
                    value={c.id}
                    checked={classId === c.id}
                    onChange={() => setClassId(c.id)}
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
    </div>
  );
}
