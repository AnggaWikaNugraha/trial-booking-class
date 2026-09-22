import { useEffect, useState } from "react";
import type { Student } from "@/lib/data/list-students";

type Result = { parentId: string; students: Student[]; error: string | null };

export function useStudents(parentId: string) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!parentId) return;
    // Ignore a slow response for a parent that is no longer selected.
    let ignore = false;
    fetch(`/api/parents/${parentId}/students`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((body) => {
        if (!ignore) setResult({ parentId, students: body.students, error: null });
      })
      .catch(() => {
        if (!ignore) setResult({ parentId, students: [], error: "Could not load children" });
      });
    return () => {
      ignore = true;
    };
  }, [parentId]);

  // Only trust a result that belongs to the current parent.
  const current = result?.parentId === parentId ? result : null;
  return {
    students: current?.students ?? [],
    loading: Boolean(parentId) && current === null,
    error: current?.error ?? null,
  };
}
