import { useCallback, useEffect, useState } from "react";
import type { TrialClass } from "@/lib/data/list-classes";

export function useClasses() {
  const [classes, setClasses] = useState<TrialClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error();
      setClasses((await res.json()).classes);
    } catch {
      setError("Could not load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { classes, loading, error, reload };
}
