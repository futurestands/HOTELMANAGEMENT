-- Migration 018: Add custom hotel roles and dynamic permissions tables for multi-tenant flexibility.

create table if not exists public.hotel_roles (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create table if not exists public.hotel_role_permissions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  role_name text not null,
  module_name text not null,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  unique (hotel_id, role_name, module_name)
);

alter table public.hotel_roles enable row level security;
alter table public.hotel_role_permissions enable row level security;

-- Policies for hotel_roles
create policy "members can view hotel roles"
on public.hotel_roles for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "admins can manage hotel roles"
on public.hotel_roles for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator'))
)
with check (
  public.is_hotel_member(hotel_id)
  and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator'))
);

-- Policies for hotel_role_permissions
create policy "members can view role permissions"
on public.hotel_role_permissions for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "admins can manage role permissions"
on public.hotel_role_permissions for all
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator'))
)
with check (
  public.is_hotel_member(hotel_id)
  and (public.has_hotel_role(hotel_id, 'owner') or public.has_hotel_role(hotel_id, 'administrator'))
);
