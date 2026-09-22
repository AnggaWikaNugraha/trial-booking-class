import { useState } from "react";

export function useResetDemo() {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resetDemo() {
    if (!window.confirm("Delete every booking and restore the initial demo data?")) return;
    setResetting(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      // A full reload also clears the form's selection and client-fetched data.
      window.location.reload();
    } catch {
      setError("Could not reset the demo data");
      setResetting(false);
    }
  }

  return { resetting, error, resetDemo };
}
