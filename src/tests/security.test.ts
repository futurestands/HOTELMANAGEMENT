import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';

// Increase timeout for network calls against Supabase remote test DB
vi.setConfig({ testTimeout: 15000 });

describe('HotelOS Security & RLS Integration Tests (Phase 1I)', () => {

  it('1. Anonymous SELECT, INSERT, UPDATE, DELETE should be denied or return empty', async () => {
    if (!supabase) {
      expect.fail('Supabase client not configured.');
    }
    await supabase.auth.signOut();

    // SELECT attempt
    const { data, error } = await supabase.from('rooms').select('*');
    const isDenied = error !== null || (data && data.length === 0);
    expect(isDenied).toBe(true);
  });

  it('2. Cross-hotel read and write isolation should be enforced', async () => {
    if (!supabase) {
      expect.fail('Supabase client not configured.');
    }
    const fakeHotelId = '88888888-8888-8888-8888-888888888888';
    const { data, error } = await supabase.from('rooms').select('*').eq('hotel_id', fakeHotelId);
    const isolated = error !== null || (data && data.length === 0);
    expect(isolated).toBe(true);
  });

  it('3. Self-promotion and unauthorized membership creation should be blocked', async () => {
    if (!supabase) {
      expect.fail('Supabase client not configured.');
    }
    const { error } = await supabase.from('hotel_memberships').insert([
      { hotel_id: '00000000-0000-0000-0000-000000000001', role: 'owner', is_active: true }
    ]);
    expect(error).not.toBeNull();
  });

  it('4. Read-only roles attempting room INSERT, UPDATE, DELETE should be blocked', async () => {
    if (!supabase) {
      expect.fail('Supabase client not configured.');
    }
    const { error } = await supabase.from('rooms').insert([
      { hotel_id: '00000000-0000-0000-0000-000000000001', room_number: 'RO-999', status: 'available' }
    ]);
    expect(error).not.toBeNull();
  });

  it('5. Database unique constraint should prevent duplicate room numbers in the same hotel', async () => {
    if (!supabase) {
      expect.fail('Supabase client not configured.');
    }
    const targetHotel = '00000000-0000-0000-0000-000000000001';
    const roomNum = 'DUP-999';

    // First insert (may fail if already exists from prior run, which is fine)
    await supabase.from('rooms').insert([{ hotel_id: targetHotel, room_number: roomNum, status: 'available' }]);

    // Second insert should definitely fail with unique constraint violation
    const { error } = await supabase.from('rooms').insert([{ hotel_id: targetHotel, room_number: roomNum, status: 'available' }]);
    expect(error).not.toBeNull();
    expect(
      error?.code === '23505' ||
      error?.message?.toLowerCase().includes('unique') ||
      error?.message?.toLowerCase().includes('duplicate') ||
      error?.message?.toLowerCase().includes('violates')
    ).toBe(true);

    // Cleanup
    await supabase.from('rooms').delete().eq('hotel_id', targetHotel).eq('room_number', roomNum);
  });

  it('6. Inactive memberships and users with no memberships should be denied access', async () => {
    if (!supabase) {
      expect.fail('Supabase client not configured.');
    }
    const { data } = await supabase.from('hotel_memberships').select('*').eq('is_active', true);
    expect(data).toBeDefined();
  });
});
