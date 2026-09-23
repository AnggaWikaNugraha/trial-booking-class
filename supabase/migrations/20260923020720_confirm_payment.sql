-- Applies a verified Midtrans notification to a booking, in one transaction.
-- This is the only place that changes confirmed_count, and the only place that
-- decides whether a paying parent gets the seat.
--
-- Returns the booking status after processing, or null when the order_id is
-- unknown. The caller has already verified the notification signature.
create or replace function confirm_payment(
  p_order_id text,
  p_paid boolean,
  p_provider_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_class_id uuid;
  v_status text;
  v_claimed_class uuid;
begin
  -- Record what the provider said, and find the booking this order belongs to.
  update payment_attempts
  set provider_status = p_provider_status
  where order_id = p_order_id
  returning booking_id into v_booking_id;

  if v_booking_id is null then
    return null;
  end if;

  -- Lock the booking so a retried notification, or two notifications arriving
  -- at once, cannot both move it out of pending_payment.
  select class_id, status into v_class_id, v_status
  from bookings
  where id = v_booking_id
  for update;

  -- Already decided. Midtrans retries notifications, and a card pays out as
  -- capture and then settlement, so this is expected rather than an error.
  if v_status is distinct from 'pending_payment' then
    return v_status;
  end if;

  if not p_paid then
    update bookings
    set status = 'payment_failed', updated_at = now()
    where id = v_booking_id and status = 'pending_payment';
    return 'payment_failed';
  end if;

  -- Claim a seat. The condition is checked against the current row while the
  -- row is locked, so out of two payments for the last seat only one succeeds.
  update trial_classes
  set confirmed_count = confirmed_count + 1
  where id = v_class_id and confirmed_count < capacity
  returning id into v_claimed_class;

  if v_claimed_class is null then
    -- Paid, but the seat was taken first. Needs a refund, so it gets its own
    -- status instead of being hidden as a payment failure.
    update bookings
    set status = 'rejected_class_full', updated_at = now()
    where id = v_booking_id and status = 'pending_payment';
    return 'rejected_class_full';
  end if;

  update bookings
  set status = 'confirmed', updated_at = now()
  where id = v_booking_id and status = 'pending_payment';
  return 'confirmed';
end;
$$;

-- Only the server (service role) may call it, never the public anon key.
revoke execute on function confirm_payment(text, boolean, text) from public, anon, authenticated;
grant execute on function confirm_payment(text, boolean, text) to service_role;
