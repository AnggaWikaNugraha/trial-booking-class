-- Restores the demo data. Used by seed.sql and by the "Reset demo data" button,
-- so the initial data is defined only here. Fixed ids keep demo URLs stable.
-- confirmed_count must equal the number of confirmed bookings in each class.
create or replace function reset_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate payment_attempts, bookings, students, parents, trial_classes;

  insert into parents (id, name, email) values
    ('10000000-0000-0000-0000-000000000001', 'Budi Santoso', 'budi@example.com'),
    ('10000000-0000-0000-0000-000000000002', 'Citra Lestari', 'citra@example.com'),
    ('10000000-0000-0000-0000-000000000003', 'Fajar Nugroho', 'fajar@example.com');

  insert into students (id, parent_id, name, grade) values
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Andi', 3),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Bella', 5),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Dimas', 4),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Eka', 2),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Gita', 6),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Hana', 4);

  insert into trial_classes (id, subject, starts_at, capacity, confirmed_count) values
    -- Seats available. Andi is already confirmed here, for the duplicate booking demo.
    ('30000000-0000-0000-0000-000000000001', 'Science Trial A', '2026-10-05 09:00+07', 4, 1),
    -- Exactly 3 confirmed, for the last-seat race demo (Bella vs Hana).
    ('30000000-0000-0000-0000-000000000002', 'Math Trial B', '2026-10-06 16:00+07', 4, 3),
    -- Full.
    ('30000000-0000-0000-0000-000000000003', 'Science Trial C', '2026-10-07 10:00+07', 4, 4);

  insert into bookings (id, student_id, class_id, status) values
    -- Science Trial A: 1 confirmed
    ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'confirmed'),
    -- Math Trial B: 3 confirmed
    ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'confirmed'),
    ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'confirmed'),
    ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'confirmed'),
    -- Science Trial C: 4 confirmed
    ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'confirmed'),
    ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'confirmed'),
    ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'confirmed'),
    ('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', 'confirmed');

  -- Every confirmed booking came from a settled payment.
  insert into payment_attempts (booking_id, order_id, provider_status, gross_amount)
  select id, 'seed-' || id, 'settlement', 150000
  from bookings;
end;
$$;

-- Only the server (service role) may call it, never the public anon key.
revoke execute on function reset_demo_data() from public, anon, authenticated;
grant execute on function reset_demo_data() to service_role;
