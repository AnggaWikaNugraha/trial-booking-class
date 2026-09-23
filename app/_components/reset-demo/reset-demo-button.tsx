"use client";

import { Button } from "../primitive/button";
import { useResetDemo } from "./hooks/use-reset-demo";

export function ResetDemoButton() {
  const { resetting, error, resetDemo } = useResetDemo();

  return (
    <div className="text-right">
      <Button variant="secondary" onClick={resetDemo} disabled={resetting}>
        {resetting ? "Resetting..." : "Reset demo data"}
      </Button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
