# RSVP Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RSVP submission and a private admin viewer backed by Supabase.

**Architecture:** Keep the invitation static. Add a public RSVP dialog/page section that inserts rows via Supabase REST with anon key. Add `admin.html` and `admin.js` that use Supabase Auth OTP and read rows only after authenticated as `benlaros@gmail.com`.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Supabase Postgres/RLS/Auth REST.

---

### Task 1: Supabase Schema

**Files:**
- Database: `public.eyal_rsvps`

- [x] Apply SQL migration:

```sql
create table if not exists public.eyal_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 120),
  guest_count integer not null check (guest_count between 1 and 20),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

alter table public.eyal_rsvps enable row level security;

revoke all on public.eyal_rsvps from anon, authenticated;
grant insert on public.eyal_rsvps to anon;
grant select on public.eyal_rsvps to authenticated;

drop policy if exists "Guests can submit RSVPs" on public.eyal_rsvps;
create policy "Guests can submit RSVPs"
on public.eyal_rsvps
for insert
to anon
with check (
  char_length(trim(guest_name)) between 1 and 120
  and guest_count between 1 and 20
  and (note is null or char_length(note) <= 500)
);

drop policy if exists "Ben can read RSVPs" on public.eyal_rsvps;
create policy "Ben can read RSVPs"
on public.eyal_rsvps
for select
to authenticated
using (((select auth.jwt()) ->> 'email') = 'benlaros@gmail.com');
```

- [x] Verify anon insert succeeds and anon select fails.
- [x] Verify security and performance advisors after schema change.

### Task 2: Static Client Config

**Files:**
- Create: `supabase-config.js`

- [x] Add public project URL and anon key constants.
- [x] Commit only anon/publishable key, never service role key.

### Task 3: Public RSVP UI

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `script.js`

- [x] Add elegant `אישור הגעה` action.
- [x] Add modal form with `guest_name`, `guest_count`, optional `note`.
- [x] Validate input before submit.
- [x] Insert via Supabase REST.
- [x] Show success/error messages.

### Task 4: Admin Viewer

**Files:**
- Create: `admin.html`
- Create: `admin.js`
- Modify: `style.css`

- [x] Add email OTP form fixed to `benlaros@gmail.com`.
- [x] Verify OTP code and keep the access token in session storage.
- [x] Fetch RSVP rows with authenticated token.
- [x] Render total guests and table/list.

### Task 5: Verification and Deploy

- [ ] Test public RSVP submit locally and live.
- [ ] Test admin unauthenticated state.
- [ ] Test admin data load with auth when possible.
- [ ] Commit and deploy to Vercel.
