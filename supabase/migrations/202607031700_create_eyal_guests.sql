create table public.eyal_guests (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  phone text,
  group_name text,
  invited_count int,
  note text,
  created_at timestamptz not null default now()
);

alter table public.eyal_guests enable row level security;

create policy "Ben manages guests" on public.eyal_guests
  for all to authenticated
  using ((select auth.jwt() ->> 'email') = 'benlaros@gmail.com')
  with check ((select auth.jwt() ->> 'email') = 'benlaros@gmail.com');

grant select, insert, update, delete on table public.eyal_guests to authenticated;

alter table public.eyal_rsvps add column guest_id uuid references public.eyal_guests(id) on delete set null;

-- data import (82 guests from רשימת מוזמנים בר מצווה אייל.csv) done via one-time insert, 2026-07-03
