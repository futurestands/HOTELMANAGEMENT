-- Migration 002: Add write policies for rooms and room types for owners, administrators, and managers

create policy "authorized staff can insert rooms"
on public.rooms for insert
to authenticated
with check (
  public.is_hotel_member(hotel_id)
  and (
    public.has_hotel_role(hotel_id, 'owner')
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
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
    or public.has_hotel_role(hotel_id, 'administrator')
    or public.has_hotel_role(hotel_id, 'manager')
    or public.has_hotel_role(hotel_id, 'receptionist')
  )
)
with check (
  public.is_hotel_member(hotel_id)
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

create policy "authorized staff can manage room types"
on public.room_types for all
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
);
