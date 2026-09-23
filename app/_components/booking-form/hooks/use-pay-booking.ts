import { useRouter } from "next/navigation";
import { useState } from "react";

type SnapCallbacks = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

// What the parent saw in the Snap popup. The booking status itself only
// changes when the verified Midtrans webhook arrives.
type Outcome = "submitted" | "failed" | "closed";

export function usePayBooking() {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payBooking(bookingId: string) {
    setPaying(true);
    setOutcome(null);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start the payment");
      if (!window.snap) throw new Error("The payment page is still loading, please try again");

      window.snap.pay(body.token, {
        onSuccess: () => finish("submitted"),
        onPending: () => finish("submitted"),
        onError: () => finish("failed"),
        onClose: () => finish("closed"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the payment");
      setPaying(false);
    }
  }

  function finish(result: Outcome) {
    setOutcome(result);
    setPaying(false);
    router.refresh();
  }

  function clearPayment() {
    setOutcome(null);
    setError(null);
  }

  return { paying, outcome, error, payBooking, clearPayment };
}
