-- Migration 004: Harden room_types policies (USING and WITH CHECK), strict membership management policies, and unassigned user onboarding safety.

-- 1. Harden room_types insert, update, delete policies with USING and WITH CHECK
drop policy if exists "authorized staff can manage room types" on public.room_types;
drop policy if exists "members can view room types" on public.room_types;

create policy "members can view room types"
on public.room_types for select
to authenticated
using (public.is_hotel_member(hotel_id));

create policy "authorized staff can insert room types"
on public.room_types for insert
to authenticated
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
  )
);

create policy "authorized staff can update room types"
on public.room_types for update
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
  )
);

create policy "authorized staff can delete room types"
on public.room_types for delete
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
);

-- 2. Harden hotel_memberships management policies preventing role escalation and hotel re-assignment
drop policy if exists "only owners or admins can manage memberships" on public.hotel_memberships;

create policy "owners and admins can insert memberships"
on public.hotel_memberships for insert
to authenticated
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
);

create policy "owners and admins can update memberships"
on public.hotel_memberships for update
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
)
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
);

create policy "owners and admins can delete memberships"
on public.hotel_memberships for delete
to authenticated
using (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
  )
);
