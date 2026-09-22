import { useEffect, useState } from "react";
import type { TrialClass } from "@/lib/data/list-classes";

export function useClasses() {
  const [classes, setClasses] = useState<TrialClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/classes")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((body) => {
        if (!ignore) setClasses(body.classes);
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

  return { classes, loading, error };
}
