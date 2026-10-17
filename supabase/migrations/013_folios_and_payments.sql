-- Migration 013: Add folios and payments tables for Cashier & Billing module with RLS policies.

create table if not exists public.folios (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  guest_id uuid references public.guests(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed','settled')),
  total_charges numeric(14,2) not null default 0,
  total_payments numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  folio_id uuid references public.folios(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash','mobile_money','card','bank')),
  reference_number text,
  created_at timestamptz not null default now()
);

alter table public.folios enable row level security;
alter table public.payments enable row level security;

-- Policies for folios
create policy "members can view folios"
on public.folios for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can manage folios"
on public.folios for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'cashier')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'cashier')
  )
);

-- Policies for payments
create policy "members can view payments"
on public.payments for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can manage payments"
on public.payments for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'cashier')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'cashier')
  )
);
