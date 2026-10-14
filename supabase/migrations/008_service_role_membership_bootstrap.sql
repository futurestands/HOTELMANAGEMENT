-- Migration 008: Allow service_role to bootstrap memberships without auth.uid() requirement.

create or replace function public.verify_membership_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  old_actor_role text;
begin
  -- Allow service_role to bypass auth.uid() checks for database seeding and test fixtures
  if (auth.jwt() ->> 'role') = 'service_role' then
    return new;
  end if;

  -- 1. Prevent platform_admin role from ever being assigned via hotel_memberships
  if new.role = 'platform_admin' then
    raise exception 'Unauthorized: Cannot assign platform_admin role through hotel memberships.';
  end if;

  -- 2. Verify actor permissions on target hotel (new.hotel_id)
  select role into actor_role
  from public.hotel_memberships
  where hotel_id = new.hotel_id
    and user_id = auth.uid()
    and is_active = true;

  if actor_role is null or actor_role not in ('owner', 'administrator') then
    raise exception 'Unauthorized: Actor must be an active owner or administrator of the target hotel.';
  end if;

  -- 3. If UPDATE operation is moving membership across hotels, verify actor permissions on source hotel (old.hotel_id)
  if tg_op = 'UPDATE' and old.hotel_id is distinct from new.hotel_id then
    select role into old_actor_role
    from public.hotel_memberships
    where hotel_id = old.hotel_id
      and user_id = auth.uid()
      and is_active = true;

    if old_actor_role is null or old_actor_role not in ('owner', 'administrator') then
      raise exception 'Unauthorized: Actor must be an active owner or administrator of the source hotel to reassign memberships.';
    end if;
  end if;

  -- 4. Administrators cannot promote anyone to 'owner'
  if new.role = 'owner' and actor_role != 'owner' then
    raise exception 'Unauthorized: Hotel administrators cannot assign the owner role. Only existing owners can assign owners.';
  end if;

  return new;
end;
$$;
