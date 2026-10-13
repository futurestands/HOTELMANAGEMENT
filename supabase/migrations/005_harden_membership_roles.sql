-- Migration 005: Prevent role escalation, block platform_admin assignment via hotel memberships, and restrict owner promotion.

create or replace function public.verify_membership_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  -- Prevent platform_admin role from ever being assigned via hotel_memberships
  if new.role = 'platform_admin' then
    raise exception 'Unauthorized: Cannot assign platform_admin role through hotel memberships.';
  end if;

  -- Get current actor's role in the target hotel
  select role into actor_role
  from public.hotel_memberships
  where hotel_id = new.hotel_id
    and user_id = auth.uid()
    and is_active = true;

  -- If actor is not an owner or admin of this hotel, block
  if actor_role is null or actor_role not in ('owner', 'administrator') then
    raise exception 'Unauthorized: Only hotel owners and administrators can manage memberships.';
  end if;

  -- Administrators cannot promote anyone to 'owner'
  if new.role = 'owner' and actor_role != 'owner' then
    raise exception 'Unauthorized: Hotel administrators cannot assign the owner role. Only existing owners can assign owners.';
  end if;

  return new;
end;
$$;

drop trigger if exists verify_membership_mutation_trigger on public.hotel_memberships;
create trigger verify_membership_mutation_trigger
  before insert or update on public.hotel_memberships
  for each row execute function public.verify_membership_mutation();
