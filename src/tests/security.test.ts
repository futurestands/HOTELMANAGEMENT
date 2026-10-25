import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

vi.setConfig({ testTimeout: 60000, hookTimeout: 30000 });

describe('HotelOS Comprehensive Security & RLS Test Suite (Phase 2P - Runtime Evidence)', () => {
  const runId = `p2p-${Date.now()}`;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  let adminClient: any = null;
  let hotelAId: string | null = null;
  let hotelBId: string | null = null;

  let ownerAId: string | null = null;
  let ownerBId: string | null = null;
  let adminAId: string | null = null;
  let managerAId: string | null = null;
  let receptionistAId: string | null = null;
  let cashierAId: string | null = null;
  let inactiveAId: string | null = null;
  let outsiderId: string | null = null;

  let clientOwnerA: any = null;
  let clientManagerA: any = null;
  let clientReceptionistA: any = null;
  let clientCashierA: any = null;
  let clientInactiveA: any = null;
  let clientOutsider: any = null;

  let roomTypeAId: string | null = null;
  let roomTypeBId: string | null = null;
  let roomA1Id: string | null = null;
  let roomB1Id: string | null = null;

  const createdAuthUserIds: string[] = [];
  const createdRecordIds: string[] = [];

  const hasConfig = Boolean(supabaseUrl && supabaseAnonKey && serviceRoleKey);

  beforeAll(async () => {
    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] beforeAll starting with hasConfig=${hasConfig}`);
    if (!hasConfig) {
      console.warn('BLOCKED: Missing required environment variables.');
      return;
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] Creating test hotels Hotel A and Hotel B...`);
    const { data: hA, error: errHA } = await adminClient.from('hotels').insert([{ name: `Hotel A ${runId}` }]).select().single();
    const { data: hB, error: errHB } = await adminClient.from('hotels').insert([{ name: `Hotel B ${runId}` }]).select().single();
    if (errHA || errHB) throw new Error(`Fixture hotel creation failed: ${errHA?.message || errHB?.message}`);
    hotelAId = hA.id;
    hotelBId = hB.id;
    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] Hotels created successfully: A=${hotelAId}, B=${hotelBId}`);

    async function createUserAndClient(emailPrefix: string) {
      const email = `${emailPrefix}-${runId}@test.com`;
      const password = `TestPass123!${runId}`;
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if (authErr || !authData.user) throw new Error(`Failed to create user ${email}: ${authErr?.message}`);
      const userId = authData.user.id;
      createdAuthUserIds.push(userId);

      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { error: signErr } = await client.auth.signInWithPassword({ email, password });
      if (signErr) throw new Error(`Failed to sign in user ${email}: ${signErr.message}`);
      return { userId, client };
    }

    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] Creating authenticated test users...`);
    const uOwnerA = await createUserAndClient('owner-a');
    ownerAId = uOwnerA.userId; clientOwnerA = uOwnerA.client;

    const uOwnerB = await createUserAndClient('owner-b');
    ownerBId = uOwnerB.userId;

    const uAdminA = await createUserAndClient('admin-a');
    adminAId = uAdminA.userId;

    const uManagerA = await createUserAndClient('manager-a');
    managerAId = uManagerA.userId; clientManagerA = uManagerA.client;

    const uRecA = await createUserAndClient('receptionist-a');
    receptionistAId = uRecA.userId; clientReceptionistA = uRecA.client;

    const uCashA = await createUserAndClient('cashier-a');
    cashierAId = uCashA.userId; clientCashierA = uCashA.client;

    const uInactA = await createUserAndClient('inactive-a');
    inactiveAId = uInactA.userId; clientInactiveA = uInactA.client;

    const uOut = await createUserAndClient('outsider');
    outsiderId = uOut.userId; clientOutsider = uOut.client;
    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] All test users created and signed in.`);

    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] Inserting test memberships...`);
    const memberships = [
      { hotel_id: hotelAId, user_id: ownerAId, role: 'owner', is_active: true },
      { hotel_id: hotelBId, user_id: ownerBId, role: 'owner', is_active: true },
      { hotel_id: hotelAId, user_id: adminAId, role: 'administrator', is_active: true },
      { hotel_id: hotelAId, user_id: managerAId, role: 'manager', is_active: true },
      { hotel_id: hotelAId, user_id: receptionistAId, role: 'receptionist', is_active: true },
      { hotel_id: hotelAId, user_id: cashierAId, role: 'cashier', is_active: true },
      { hotel_id: hotelAId, user_id: inactiveAId, role: 'receptionist', is_active: false },
    ];
    const { error: memErr } = await adminClient.from('hotel_memberships').insert(memberships);
    if (memErr) throw new Error(`Fixture memberships creation failed: ${memErr.message}`);

    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] Inserting room types and test rooms...`);
    const { data: rtA } = await adminClient.from('room_types').insert([{ hotel_id: hotelAId, name: 'Deluxe A', base_rate: 150000, minimum_rate: 100000 }]).select().single();
    const { data: rtB } = await adminClient.from('room_types').insert([{ hotel_id: hotelBId, name: 'Deluxe B', base_rate: 200000, minimum_rate: 150000 }]).select().single();
    if (rtA) roomTypeAId = rtA.id;
    if (rtB) roomTypeBId = rtB.id;

    const { data: rA1 } = await adminClient.from('rooms').insert([{ hotel_id: hotelAId, room_number: `A101-${runId}`, room_type_id: roomTypeAId, status: 'available' }]).select().single();
    const { data: rB1 } = await adminClient.from('rooms').insert([{ hotel_id: hotelBId, room_number: `B101-${runId}`, room_type_id: roomTypeBId, status: 'available' }]).select().single();
    if (rA1) { roomA1Id = rA1.id; createdRecordIds.push(rA1.id); }
    if (rB1) { roomB1Id = rB1.id; createdRecordIds.push(rB1.id); }
    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] beforeAll completed successfully.`);
  });

  afterAll(async () => {
    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] afterAll cleanup starting...`);
    if (!adminClient) return;
    if (createdRecordIds.length > 0) {
      await adminClient.from('rooms').delete().in('id', createdRecordIds);
    }
    if (roomTypeAId) await adminClient.from('room_types').delete().eq('id', roomTypeAId);
    if (roomTypeBId) await adminClient.from('room_types').delete().eq('id', roomTypeBId);
    if (hotelAId) await adminClient.from('hotels').delete().eq('id', hotelAId);
    if (hotelBId) await adminClient.from('hotels').delete().eq('id', hotelBId);
    for (const uid of createdAuthUserIds) {
      await adminClient.auth.admin.deleteUser(uid);
    }
    console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] afterAll cleanup completed.`);
  });

  it('1. Cross-hotel SELECT isolation (ownerA vs Hotel B records)', async () => {
    if (!hasConfig || !roomB1Id) {
      expect.fail('BLOCKED: Missing test configuration.');
    }
    const { data: readB, error } = await clientOwnerA.from('rooms').select('*').eq('id', roomB1Id);
    expect(error).toBeNull();
    expect(readB?.length || 0).toBe(0);
  });

  it('2. Cross-hotel INSERT protection', async () => {
    if (!hasConfig || !hotelBId) {
      expect.fail('BLOCKED: Missing test configuration.');
    }
    const { error: insErr } = await clientOwnerA.from('rooms').insert([
      { hotel_id: hotelBId, room_number: `B999-${runId}`, status: 'available' }
    ]);
    expect(insErr).not.toBeNull();
    expect(insErr?.code).toBe('42501');
  });

  it('3. Inactive employee access restriction', async () => {
    if (!hasConfig || !hotelAId) {
      expect.fail('BLOCKED: Missing test configuration.');
    }
    const { data: inactRooms, error } = await clientInactiveA.from('rooms').select('*').eq('hotel_id', hotelAId);
    expect(error).toBeNull();
    expect(inactRooms?.length || 0).toBe(0);
  });

  it('4. Cashier role write restriction', async () => {
    if (!hasConfig || !hotelAId) {
      expect.fail('BLOCKED: Missing test configuration.');
    }
    const { error: cashierErr } = await clientCashierA.from('rooms').insert([
      { hotel_id: hotelAId, room_number: `CASH-${runId}`, status: 'available' }
    ]);
    expect(cashierErr).not.toBeNull();
    expect(cashierErr?.code).toBe('42501');
  });

  it('5. Room uniqueness and case-insensitive check', async () => {
    if (!hasConfig || !hotelAId) {
      expect.fail('BLOCKED: Missing test configuration.');
    }
    const dupNum = `DUP-${runId}`;
    const { data: ins1, error: err1 } = await clientOwnerA.from('rooms').insert([
      { hotel_id: hotelAId, room_number: dupNum, status: 'available' }
    ]).select().single();
    expect(err1).toBeNull();
    if (ins1) createdRecordIds.push(ins1.id);

    const { error: err2 } = await clientOwnerA.from('rooms').insert([
      { hotel_id: hotelAId, room_number: dupNum.toLowerCase(), status: 'available' }
    ]);
    expect(err2).not.toBeNull();
    expect(err2?.code).toBe('23505');
  });
});
