alter table public.eyal_rsvps add column rsvp_group text
  check (rsvp_group is null or rsvp_group in ('משפחה','חברים של המשפחה','חברים של אייל'));
