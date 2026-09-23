import { useCallback, useEffect, useState } from "react";
import type { TrialClass } from "@/lib/data/list-classes";

async function fetchClasses(): Promise<TrialClass[]> {
  const res = await fetch("/api/classes");
  if (!res.ok) throw new Error(`GET /api/classes failed with ${res.status}`);
  return (await res.json()).classes;
}

export function useClasses() {
  const [classes, setClasses] = useState<TrialClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      fetchClasses()
        .then(setClasses)
        .catch(() => setError("Could not load classes"))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    let ignore = false;
    fetchClasses()
      .then((loaded) => {
        if (!ignore) setClasses(loaded);
      })
      .catch(() => {
        if (!ignore) setError("Could not load classes");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { classes, loading, error, reload };
}
