# CLAUDE.md

@AGENTS.md

## Context

Ottodot take-home: a trial class booking system, capacity of 4 students per class. Focus on backend correctness, not UI. Scope is trial booking only.

**README.md is the source of truth for the design.** The data model, booking statuses, endpoints, folder structure, Midtrans payment flow, and last-seat race approach follow the README. If the design changes, update README.md and README.id.md too.

Stack:

- Frontend: Next.js App Router, React, TypeScript, Tailwind
- Backend: Next.js Route Handlers for the API and webhook (no Express)
- Database: Supabase (Postgres), Postgres function `confirm_payment` for atomic logic
- Payment: Midtrans Snap sandbox with the Payment Notification webhook
- Deployment: Vercel
- Testing: Vitest

## Commands

- `npx supabase link --project-ref <ref>` links the CLI to the online Supabase project (once)
- `npx supabase db push` applies new migrations to online Supabase
- `npx supabase db reset --linked` wipes all data and reruns migrations and seed on online Supabase
- `npm run dev` runs the app
- `npm test` runs all tests against online Supabase. Tests wipe the data, so run `db reset --linked` (or click **Reset demo data** in the app) afterwards to restore the seed. Tell the user before running tests, since the app they may be using goes empty
- Demo data is defined once, in the Postgres function `reset_demo_data()`. `seed.sql` only calls it. Change demo data with a new migration that replaces the function

There is no local Supabase or Docker. Development, tests, and the Vercel demo all use one online Supabase project (Postgres).

## Hard Rules

- All API endpoints and the webhook use Next.js route handlers.
- `confirmed_count` changes only through the `confirm_payment` function. Never "count then insert/update" in application code.
- Every booking status update must use `WHERE status = 'pending_payment'`.
- Payment status comes only from a Midtrans webhook whose signature has been verified. Never trust payment results from the client.
- Duplicates are prevented by a partial unique index. Catch error `23505` and return 409.
- Schema changes always go through a new migration file in `supabase/migrations`.
- Every change to booking or payment logic must come with tests. The race tests N8 and N9 must keep passing.
- Do not build anything listed in the README section "What Was Deliberately Cut".

## UI Conventions

- Reusable form building blocks live in `app/_components/primitive/` (`Select`, `Input`, `Button`, `FormFieldGroup`). Use them instead of raw `<select>`, `<input>`, or `<button>`. `Button` has `primary` and `secondary` variants.
- Each feature gets a folder in `app/_components/<feature>/`. State and data fetching go in custom hooks under its `hooks/` folder; components only take props.
- Do not wrap a single field in its own component. Compose `FormFieldGroup` + a primitive directly in the feature component.
- Destructure hook results, and alias clashing names (`loading: studentsLoading`).
- Database queries live in `lib/data/`, one function per file named after it (`list-parents.ts` exports `listParents`). A type sits in the file of the function that returns it. No barrel `index.ts`.

## How to Work

- Work through the TODO in flow order.
- Finish each flow completely: database, backend, UI, then its tests.
- When an item is done and its tests pass, change `[ ]` to `[x]`.
- After each flow, stop so the user can review the changes. Commit only when the user asks.

## TODO

### Planning
- [x] Understand the brief and choose the last-seat race approach
- [x] Draft README
- [x] Draft CLAUDE.md

### Foundation

```
Next.js + Tailwind ─► online Supabase ─► table migrations + constraints ─► seed ─► Vitest
```

- [x] Initialize Next.js with TypeScript and Tailwind
- [x] Create the online Supabase project, `npx supabase init`, then `npx supabase link`
- [x] Create `.env.example`
- [x] Migrations for tables `parents`, `students`, `trial_classes`, `bookings`, `payment_attempts`
- [x] Partial unique index against duplicate bookings
- [x] CHECK constraint `confirmed_count <= capacity`
- [x] `supabase/seed.sql` (classes with 1, 3, and 4 confirmed students)
- [x] `lib/supabase.ts` (server client with the service role)
- [x] Vitest config and a test data reset helper

### Flow 1: Choose Child and Class

```
Parent ─► choose parent ─► GET /api/parents/:id/students ─► choose child
       ─► GET /api/classes (with remaining seats) ─► choose class
```

- [x] `GET /api/parents/:id/students`
- [x] `GET /api/classes` with remaining seats
- [x] Booking page UI: parent and child dropdowns, class list
- [x] Test P1

### Flow 2: Create Booking

```
Submit booking ─► POST /api/bookings ─► insert bookings (pending_payment)
                                             ├─► success ─► 201 + booking_id
                                             └─► error 23505 ─► 409 duplicate
```

- [x] `POST /api/bookings` with validation that the child belongs to the parent
- [x] Catch error `23505` and return 409
- [x] UI submit button and duplicate message
- [x] Tests P2, N1, N2

### Flow 3: Midtrans Payment

```
Pay button ─► POST /api/bookings/:id/pay
                  ─► create Snap transaction (unique order_id)
                  ─► save payment_attempts
                  ─► return snap token
           ─► parent pays in Midtrans Snap
```

- [x] `lib/midtrans.ts`: create Snap transaction
- [x] `POST /api/bookings/:id/pay`
- [x] UI pay button with Midtrans Snap

### Flow 4: Webhook and Seat Confirmation

```
Midtrans ─► POST /api/payments/midtrans/notification
         ─► verify signature
               ├─► invalid ─► 401
               └─► valid ─► map Midtrans status
                              ├─► pending ─► ignore (200)
                              ├─► failure ─► confirm_payment ─► payment_failed
                              └─► success ─► confirm_payment
                                               ├─► seat available ─► confirmed
                                               └─► no seats left ─► rejected_class_full
```

- [x] `confirm_payment` function (new migration)
- [x] `lib/midtrans.ts`: signature verification
- [x] Map Midtrans statuses to success, failure, or ignore
- [x] `POST /api/payments/midtrans/notification`
- [x] Test helper for building signed Midtrans notifications
- [x] Tests P3, N3, N4, N5, N6, N7
- [x] Last-seat race tests N8 and N9

### Flow 5: Booking Status

```
Status page ─► GET /api/bookings/:id ─► show status
            ─► repeat (polling) while still pending_payment
```

- [ ] `GET /api/bookings/:id`
- [ ] Booking status page UI with polling
- [ ] Test P4

### Flow 6: Roster

```
Admin or teacher ─► GET /api/classes/:id/roster ─► confirmed bookings only
```

- [ ] `GET /api/classes/:id/roster`
- [ ] Roster page UI per class
- [ ] Test P5

### Deploy

```
Reseed (db reset --linked) ─► Vercel (env) ─► Midtrans notification URL ─► end-to-end test
```

- [ ] Run `npx supabase db reset --linked` so the demo data is clean
- [ ] Deploy to Vercel with environment variables
- [ ] Set the Payment Notification URL in the Midtrans sandbox dashboard
- [ ] Test the full flow in the sandbox: success, failure, duplicate, last seat

### Documentation and Submission
- [ ] Fill in the README TODOs (time, demo steps, Vercel link)
- [ ] Write AI_USAGE.md from the section below
- [ ] Record a 5 to 8 minute video walkthrough
- [ ] Make sure the repo is public and send the link

## Notes

### 1. AI Tools Used

- Claude Code: code implementation, tests, and database migrations (guided by this CLAUDE.md)

### 2. What AI Was Used For

- Discussing the last-seat race approach options and their trade-offs
- Drafting the data schema, booking status flow, endpoint list, and test cases
- Drafting README and CLAUDE.md
- [TODO] Implementation with Claude Code

Decisions I made myself: choosing the atomic check at payment confirmation, using a stack I already know (Next.js, Supabase, Vercel), using Midtrans sandbox with a webhook, Next.js fullstack without Express, structuring test cases as positive, negative, and last-seat race, and organizing the TODO by flow.

### 3. Where AI Helped Me Move Faster

During planning, it explained the core of what is being tested (concurrency and data integrity), then drafted a README skeleton that maps every requirement in the brief. The understanding and planning stage, which usually takes a long time, went much faster before I started coding.

[TODO] Add an example from the implementation stage if there is a stronger one.

### 4. AI Output I Corrected or Rejected

- Claude first designed payment as a mock (success or failure chosen from the client). I changed it to use Midtrans sandbox because I have integrated it before. As a result, the design changed: payment status must come from a webhook with a verified signature, and handling duplicate notifications became important.
- Claude first suggested Next.js with Postgres via Docker. I switched to the stack I already use (Supabase and Vercel). That led to moving the seat claim logic into the Postgres function `confirm_payment`, because the Supabase JS client does not support multi-statement transactions.
- Claude first organized the TODO by technical layer (setup, database, backend, UI). I changed it to be organized by flow with flow diagrams, so each feature is built and tested fully before moving to the next.

[TODO] Add corrections from the implementation stage.

### 5. What I Would Change About My AI Workflow

[TODO] Fill in at the end.

### 6. How I Verified the Final Implementation

[TODO] Fill in after verification is actually done. Plan: run all tests including N8 and N9, try the full flow in the Midtrans sandbox through the Vercel URL, check the Supabase tables after each scenario, and reread `confirm_payment`.
