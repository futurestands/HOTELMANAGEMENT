-- Migration 003: Harden Rooms security, unique constraint on room_number per hotel, strict RLS UPDATE USING and WITH CHECK policies, and secure profile/membership defaults.

-- 1. Ensure case-insensitive unique room number per hotel
drop index if exists public.rooms_hotel_room_number_idx;
create unique index rooms_hotel_room_number_idx on public.rooms (hotel_id, lower(room_number));

-- 2. Correct rooms policies (DROP existing and recreate with strict USING and WITH CHECK)
drop policy if exists "authorized staff can insert rooms" on public.rooms;
drop policy if exists "authorized staff can update rooms" on public.rooms;
drop policy if exists "authorized staff can delete rooms" on public.rooms;
drop policy if exists "members can view rooms" on public.rooms;

create policy "members can view rooms"
on public.rooms for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can insert rooms"
on public.rooms for insert
to authenticated
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
);

create policy "authorized staff can update rooms"
on public.rooms for update
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
);

create policy "authorized staff can delete rooms"
on public.rooms for delete
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
);

-- 3. Prevent users from self-assigning memberships or escalating roles
drop policy if exists "members can view memberships in their hotel" on public.hotel_memberships;
create policy "members can view memberships in their hotel"
on public.hotel_memberships for select
to authenticated
using (public.is_hotel_member(hotel_id) or user_id = auth.uid());

create policy "only owners or admins can manage memberships"
on public.hotel_memberships for all
to authenticated
using (
  public.has_hotel_role(hotel_id, 'owner')
  or public.has_hotel_role(hotel_id, 'administrator')
)
with check (
  public.has_hotel_role(hotel_id, 'owner')
  or public.has_hotel_role(hotel_id, 'administrator')
);

-- 4. Secure profile creation on auth sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
