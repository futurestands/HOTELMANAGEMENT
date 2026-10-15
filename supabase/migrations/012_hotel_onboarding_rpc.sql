-- Migration 012: Add secure create_initial_hotel RPC function for tenant onboarding.

create or replace function public.create_initial_hotel(
  p_name text,
  p_currency text default 'UGX',
  p_timezone text default 'Africa/Kampala'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_hotel_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Authentication required to create a hotel.';
  end if;

  if trim(p_name) = '' then
    raise exception 'Hotel name cannot be empty.';
  end if;

  -- Insert hotel
  insert into public.hotels (name, currency, timezone)
  values (trim(p_name), coalesce(nullif(trim(p_currency), ''), 'UGX'), coalesce(nullif(trim(p_timezone), ''), 'Africa/Kampala'))
  returning id into new_hotel_id;

  -- Insert owner membership for current user
  insert into public.hotel_memberships (hotel_id, user_id, role, is_active)
  values (new_hotel_id, current_user_id, 'owner', true);

  return new_hotel_id;
end;
$$;
