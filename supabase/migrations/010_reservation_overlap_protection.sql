-- Migration 010: Database-level reservation overlap protection trigger.

create or replace function public.check_reservation_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If reservation is cancelled, ignore
  if new.status = 'cancelled' then
    return new;
  end if;

  -- Check for overlapping active reservations on the same room
  if exists (
    select 1
    from public.reservations r
    where r.room_id = new.room_id
      and r.id is distinct from new.id
      and r.status != 'cancelled'
      and r.check_in_date < new.check_out_date
      and r.check_out_date > new.check_in_date
  ) then
    raise exception 'Conflict: Room is already booked for the selected date range.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_reservation_overlap_trigger on public.reservations;
create trigger enforce_reservation_overlap_trigger
  before insert or update on public.reservations
  for each row execute function public.check_reservation_overlap();
