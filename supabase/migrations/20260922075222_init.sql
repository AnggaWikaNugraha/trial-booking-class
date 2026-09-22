-- Schema for the trial booking system. The constraints here are the final
-- guard for the booking invariants; application code is not trusted to keep them.

create table parents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique
);

create table students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents (id),
  name text not null,
  grade int not null
);

create index students_parent_id_idx on students (parent_id);

create table trial_classes (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  starts_at timestamptz not null,
  capacity int not null default 4 check (capacity > 0),
  confirmed_count int not null default 0 check (confirmed_count >= 0),
  -- Last line of defense against overbooking.
  constraint trial_classes_not_overbooked check (confirmed_count <= capacity)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id),
  class_id uuid not null references trial_classes (id),
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'confirmed', 'payment_failed', 'rejected_class_full')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one active booking per child and class. Failed or rejected bookings
-- fall outside the index, so the parent can book again.
create unique index bookings_one_active_per_student_class
  on bookings (student_id, class_id)
  where status in ('pending_payment', 'confirmed');

create index bookings_class_id_status_idx on bookings (class_id, status);

create table payment_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id),
  -- Midtrans rejects a reused order_id, so every attempt gets its own.
  order_id text not null unique,
  provider_status text,
  gross_amount int not null check (gross_amount > 0),
  created_at timestamptz not null default now()
);

create index payment_attempts_booking_id_idx on payment_attempts (booking_id);

-- All access goes through the server with the service role key, which bypasses
-- RLS. Enabling RLS without policies blocks the public anon key entirely.
alter table parents enable row level security;
alter table students enable row level security;
alter table trial_classes enable row level security;
alter table bookings enable row level security;
alter table payment_attempts enable row level security;
