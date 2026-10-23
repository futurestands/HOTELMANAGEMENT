-- Migration 014: Add stock_items and stock_movements tables for Inventory & Purchasing module with RLS policies.

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  unit text not null default 'pcs',
  quantity_in_stock numeric(12,2) not null default 0,
  reorder_threshold numeric(12,2) not null default 5,
  unit_cost numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('receipt','issue','adjustment','waste')),
  quantity numeric(12,2) not null,
  reference_note text,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;

-- Policies for stock_items
create policy "members can view stock items"
on public.stock_items for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can manage stock items"
on public.stock_items for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'storekeeper')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'storekeeper')
  )
);

-- Policies for stock_movements
create policy "members can view stock movements"
on public.stock_movements for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can manage stock movements"
on public.stock_movements for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'storekeeper')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'storekeeper')
  )
);
