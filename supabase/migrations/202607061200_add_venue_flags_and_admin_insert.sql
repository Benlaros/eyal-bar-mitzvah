alter table public.eyal_rsvps
  add column at_synagogue boolean not null default true,
  add column at_restaurant boolean not null default true;

-- admin (Ben) can insert RSVPs directly (phone confirmations)
create policy "Ben can insert RSVPs" on public.eyal_rsvps
  for insert to authenticated
  with check ((select auth.jwt() ->> 'email') = 'benlaros@gmail.com');

grant insert on table public.eyal_rsvps to authenticated;
