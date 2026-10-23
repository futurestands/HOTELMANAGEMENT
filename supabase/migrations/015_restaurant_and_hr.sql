-- Migration 015: Add restaurant POS tables and HR employee/leave tables with RLS policies.

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  category text not null default 'Food',
  price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  guest_id uuid references public.guests(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','served','settled','cancelled')),
  total_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  full_name text not null,
  position text not null,
  department text not null default 'Operations',
  phone text,
  hire_date date not null default current_date,
  salary numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type text not null default 'Annual',
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.restaurant_orders enable row level security;
alter table public.employees enable row level security;
alter table public.leave_requests enable row level security;

-- Policies for menu_items & restaurant_orders
create policy "members can view menu items" on public.menu_items for select to authenticated using (public.is_hotel_member(hotel_id));
create policy "staff can manage menu items" on public.menu_items for all to authenticated using (public.is_hotel_member(hotel_id) and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator') or public.has_hotel_role(hotel_id, 'manager') or public.has_hotel_role(hotel_id, 'restaurant_staff'))) with check (public.is_hotel_member(hotel_id));

create policy "members can view restaurant orders" on public.restaurant_orders for select to authenticated using (public.is_hotel_member(hotel_id));
create policy "staff can manage restaurant orders" on public.restaurant_orders for all to authenticated using (public.is_hotel_member(hotel_id) and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator') or public.has_hotel_role(hotel_id, 'manager') or public.has_hotel_role(hotel_id, 'restaurant_staff') or public.has_hotel_role(hotel_id, 'cashier'))) with check (public.is_hotel_member(hotel_id));

-- Policies for employees & leave_requests
create policy "members can view employees" on public.employees for select to authenticated using (public.is_hotel_member(hotel_id));
create policy "hr can manage employees" on public.employees for all to authenticated using (public.is_hotel_member(hotel_id) and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator') or public.has_hotel_role(hotel_id, 'manager') or public.has_hotel_role(hotel_id, 'hr'))) with check (public.is_hotel_member(hotel_id));

create policy "members can view leave requests" on public.leave_requests for select to authenticated using (public.is_hotel_member(hotel_id));
create policy "hr can manage leave requests" on public.leave_requests for all to authenticated using (public.is_hotel_member(hotel_id) and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator') or public.has_hotel_role(hotel_id, 'manager') or public.has_hotel_role(hotel_id, 'hr'))) with check (public.is_hotel_member(hotel_id));
