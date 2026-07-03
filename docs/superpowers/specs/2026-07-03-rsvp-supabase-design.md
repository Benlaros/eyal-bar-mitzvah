# RSVP Supabase Design

## Goal
Add RSVP collection to Eyal's Bar Mitzvah invitation while keeping the public invitation static, elegant, and safe.

## Public Flow
Guests click `אישור הגעה`, enter:
- name
- number of guests, 1-20
- optional note

The form stores a single RSVP row in Supabase and shows a calm confirmation message.

## Admin Flow
Ben opens `admin.html`, signs in with Supabase magic link using `benlaros@gmail.com`, and sees:
- total RSVP rows
- total confirmed guests
- list of names, guest counts, notes, and timestamps

## Data Model
Table: `public.eyal_rsvps`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `guest_name text not null check length 1-120`
- `guest_count integer not null check 1-20`
- `note text check length <= 500`
- `created_at timestamptz default now()`

## Security Model
- Public `anon` role can only `insert`.
- Public users cannot `select`, `update`, or `delete`.
- Authenticated users can `select` only when JWT email is `benlaros@gmail.com`.
- No service role key is exposed in static files.
- Client uses Supabase REST/Auth endpoints with the public anon key only.

## Static Site Constraints
No framework and no build step. Use native `fetch`, HTML, CSS, and vanilla JavaScript.

