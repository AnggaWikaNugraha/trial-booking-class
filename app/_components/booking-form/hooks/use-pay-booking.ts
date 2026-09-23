import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

// After a payment is sent, the webhook decides the outcome. The booking status
// page polls for it, so send the parent there.
const REDIRECT_DELAY_MS = 3000;

export function usePayBooking({ onFinished }: { onFinished?: () => void } = {}) {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paying, setPaying] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Leaving the page before the redirect fires should cancel it.
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

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
        onSuccess: () => finish("submitted", bookingId),
        onPending: () => finish("submitted", bookingId),
        onError: () => finish("failed"),
        onClose: () => finish("closed"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the payment");
      setPaying(false);
    }
  }

  function finish(result: Outcome, bookingId?: string) {
    setOutcome(result);
    setPaying(false);
    if (result === "submitted" && bookingId) {
      redirectTimer.current = setTimeout(() => {
        router.push(`/bookings/${bookingId}`);
      }, REDIRECT_DELAY_MS);
    }
    // Midtrans confirms through the webhook, which can land a moment later,
    // so the seat count may still be one refresh behind.
    router.refresh();
    onFinished?.();
  }

  function clearPayment() {
    setOutcome(null);
    setError(null);
  }

  return { paying, outcome, error, payBooking, clearPayment };
}
