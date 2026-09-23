type Props = {
  capacity: number;
  taken: number;
  /** Bookings that have paid or are paying but hold no seat yet. */
  awaiting?: number;
};

// Capacity is the whole point of this app, so it gets a picture: one dot per
// seat, filled for taken seats, plus a hint of who is still competing for the
// free ones.
export function SeatMeter({ capacity, taken, awaiting = 0 }: Props) {
  const left = capacity - taken;

  return (
    <div className="text-right">
      <div className="flex justify-end gap-1" aria-hidden>
        {Array.from({ length: capacity }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full ${i < taken ? "bg-primary" : "border border-border"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {left === 0 ? "Full" : `${left} of ${capacity} seats left`}
      </p>
      {awaiting > 0 && (
        <p className="text-xs text-muted">
          {awaiting} awaiting payment
        </p>
      )}
    </div>
  );
}
