-- Hotel Management System
-- Core multi-tenant schema.
-- Run this migration in a dedicated development Supabase project first.

create extension if not exists pgcrypto;

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  currency text not null default 'UGX',
  timezone text not null default 'Africa/Kampala',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_memberships (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','administrator','manager','receptionist','cashier','storekeeper','hr')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, user_id)
);

create table if not exists public.permissions (
  code text primary key,
  description text not null
);

create table if not exists public.role_permissions (
  role text not null,
  permission_code text not null references public.permissions(code) on delete cascade,
  primary key (role, permission_code)
);

create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  description text,
  base_rate numeric(14,2) not null default 0,
  minimum_rate numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  room_type_id uuid references public.room_types(id) on delete set null,
  room_number text not null,
  floor text,
  status text not null default 'available'
    check (status in ('available','reserved','occupied','cleaning','maintenance','out_of_service')),
  created_at timestamptz not null default now(),
  unique (hotel_id, room_number)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.permissions(code, description) values
('dashboard.view','View dashboards'),
('reservations.view','View reservations'),
('reservations.create','Create reservations'),
('reservations.manage','Manage reservations'),
('rooms.view','View rooms'),
('rooms.manage','Manage rooms'),
('cashier.view','Access cashier'),
('cashier.collect','Receive payments'),
('cashier.void','Void or reverse payments'),
('inventory.view','View inventory'),
('inventory.manage','Receive and issue stock'),
('inventory.adjust','Adjust stock with approval'),
('restaurant.manage','Manage restaurant orders'),
('hr.view','View HR records'),
('hr.manage','Manage HR records'),
('leave.request','Request leave'),
('leave.approve','Approve leave'),
('reports.operational','View operational reports'),
('reports.finance','View financial reports'),
('settings.manage','Manage hotel settings'),
('users.manage','Manage users'),
('audit.view','View audit logs')
on conflict (code) do nothing;

alter table public.hotels enable row level security;
alter table public.profiles enable row level security;
alter table public.hotel_memberships enable row level security;
alter table public.room_types enable row level security;
alter table public.rooms enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_hotel_member(target_hotel uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hotel_memberships m
    where m.hotel_id = target_hotel
      and m.user_id = auth.uid()
      and m.is_active = true
  );
$$;

create or replace function public.has_hotel_role(target_hotel uuid, target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hotel_memberships m
    where m.hotel_id = target_hotel
      and m.user_id = auth.uid()
      and m.role = target_role
      and m.is_active = true
  );
$$;

create policy "members can view their hotels"
on public.hotels for select
using (public.is_hotel_member(id));

create policy "users can view own profile"
on public.profiles for select
using (id = auth.uid());

create policy "members can view memberships in their hotel"
on public.hotel_memberships for select
using (public.is_hotel_member(hotel_id));

create policy "members can view room types"
on public.room_types for select
using (public.is_hotel_member(hotel_id));

create policy "members can view rooms"
on public.rooms for select
using (public.is_hotel_member(hotel_id));

create policy "authorized users can view audit logs"
on public.audit_logs for select
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
);

-- NOTE:
-- Insert/update/delete policies will be added module-by-module.
-- This avoids accidentally giving broad write access before approval rules
-- and business workflows are implemented.
