grant update, delete on table public.eyal_rsvps to authenticated;

create policy "Ben can update RSVPs" on public.eyal_rsvps
  for update to authenticated
  using ((select auth.jwt() ->> 'email') = 'benlaros@gmail.com')
  with check (
    char_length(trim(guest_name)) between 1 and 120
    and guest_count between 1 and 20
    and (note is null or char_length(note) <= 500)
  );

create policy "Ben can delete RSVPs" on public.eyal_rsvps
  for delete to authenticated
  using ((select auth.jwt() ->> 'email') = 'benlaros@gmail.com');
