create table if not exists public.eyal_rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 120),
  guest_count integer not null check (guest_count between 1 and 20),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

alter table public.eyal_rsvps enable row level security;

revoke all on public.eyal_rsvps from anon, authenticated;
grant usage on schema public to anon, authenticated;
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
