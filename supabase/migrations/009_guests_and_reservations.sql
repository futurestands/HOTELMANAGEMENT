-- Migration 009: Add guests and reservations tables with RLS policies.

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  id_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  check_in_date date not null,
  check_out_date date not null,
  adults integer not null default 1,
  children integer not null default 0,
  agreed_rate numeric(14,2) not null default 0,
  status text not null default 'confirmed'
    check (status in ('confirmed','checked_in','checked_out','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;
alter table public.reservations enable row level security;

-- Policies for guests
create policy "members can view guests"
on public.guests for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can manage guests"
on public.guests for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
);

-- Policies for reservations
create policy "members can view reservations"
on public.reservations for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can manage reservations"
on public.reservations for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
);
