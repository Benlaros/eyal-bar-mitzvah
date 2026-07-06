-- guest_count 0 = phone-confirmed "not coming" (admin only; anon policy still requires >=1)
alter table public.eyal_rsvps drop constraint eyal_rsvps_guest_count_check;
alter table public.eyal_rsvps add constraint eyal_rsvps_guest_count_check
  check (guest_count >= 0 and guest_count <= 20);
