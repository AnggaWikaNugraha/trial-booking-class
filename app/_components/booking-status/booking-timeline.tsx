const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

type Props = {
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string | null;
};

// Shows how far the booking got: created, paid, decided.
export function BookingTimeline({ status, createdAt, updatedAt, paymentStatus }: Props) {
  const decided = status !== "pending_payment";
  const steps = [
    { label: "Booking created", note: dateFormat.format(new Date(createdAt)), done: true },
    {
      label: "Payment",
      note: paymentStatus ? `Midtrans says ${paymentStatus}` : "waiting for Midtrans",
      done: Boolean(paymentStatus),
    },
    {
      label: "Seat decided",
      note: decided ? dateFormat.format(new Date(updatedAt)) : "not yet",
      done: decided,
    },
  ];

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          <span
            className={`mt-1 size-2.5 shrink-0 rounded-full ${
              step.done ? "bg-primary" : "border border-border"
            }`}
          />
          <span className="text-sm">
            <span className={step.done ? "" : "text-muted"}>{step.label}</span>
            <span className="block text-xs text-muted">{step.note}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
