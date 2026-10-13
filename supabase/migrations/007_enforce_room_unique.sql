-- Migration 007: Enforce case-insensitive unique rooms per hotel safely.

-- Clean up any potential duplicates first (keeping newest created)
delete from public.rooms a
using public.rooms b
where a.id < b.id
  and a.hotel_id = b.hotel_id
  and lower(a.room_number) = lower(b.room_number);

-- Create unique index case-insensitively
drop index if exists public.rooms_hotel_room_number_idx;
create unique index rooms_hotel_room_number_idx on public.rooms (hotel_id, lower(room_number));
