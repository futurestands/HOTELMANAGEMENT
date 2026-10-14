import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Room, RoomType, Guest, Reservation, UserRole } from '../types/hotel';

interface ModuleViewProps {
  moduleName: string;
  hotelId?: string;
  userRole?: UserRole;
}

export const ModuleViews: React.FC<ModuleViewProps> = ({ moduleName, hotelId, userRole }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Room Form State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [roomStatus, setRoomStatus] = useState<Room['status']>('available');

  // Guest Form State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestIdNum, setGuestIdNum] = useState('');

  // Reservation Form State
  const [resGuestId, setResGuestId] = useState('');
  const [resRoomId, setResRoomId] = useState('');
  const [resCheckIn, setResCheckIn] = useState('');
  const [resCheckOut, setResCheckOut] = useState('');
  const [resAdults, setResAdults] = useState('1');
  const [resRate, setResRate] = useState('150000');

  const [submitting, setSubmitting] = useState(false);

  const canManage = ['owner', 'administrator', 'manager', 'receptionist'].includes(userRole || '');

  useEffect(() => {
    if (!hotelId) return;
    if (moduleName === 'Rooms') {
      fetchRoomsAndTypes(hotelId);
    } else if (moduleName === 'Reservations') {
      fetchReservationsAndFixtures(hotelId);
    }
  }, [moduleName, hotelId]);

  const fetchRoomsAndTypes = async (targetHotelId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: typesData } = await supabase.from('room_types').select('*').eq('hotel_id', targetHotelId);
      setRoomTypes(typesData || []);

      const { data: roomsData } = await supabase.from('rooms').select('*, room_type:room_types(*)').eq('hotel_id', targetHotelId).order('room_number');
      setRooms(roomsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationsAndFixtures = async (targetHotelId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: gData } = await supabase.from('guests').select('*').eq('hotel_id', targetHotelId);
      setGuests(gData || []);

      const { data: rData } = await supabase.from('rooms').select('*').eq('hotel_id', targetHotelId);
      setRooms(rData || []);

      const { data: resData } = await supabase.from('reservations').select('*, guest:guests(*), room:rooms(*)').eq('hotel_id', targetHotelId).order('created_at', { ascending: false });
      setReservations(resData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        hotel_id: hotelId,
        room_number: roomNumber.trim(),
        floor: roomFloor.trim(),
        room_type_id: roomTypeId || null,
        status: roomStatus,
        housekeeping_status: 'clean'
      };

      if (editingRoom) {
        const { error: updErr } = await supabase.from('rooms').update(payload).eq('id', editingRoom.id);
        if (updErr) throw updErr;
        setNotice(`Room "${roomNumber}" updated successfully.`);
      } else {
        const { error: insErr } = await supabase.from('rooms').insert([payload]);
        if (insErr) throw insErr;
        setNotice(`Room "${roomNumber}" created successfully.`);
      }
      setModalOpen(false);
      await fetchRoomsAndTypes(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to save room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from('guests').insert([{
        hotel_id: hotelId,
        full_name: guestName.trim(),
        email: guestEmail.trim() || null,
        phone: guestPhone.trim() || null,
        id_number: guestIdNum.trim() || null
      }]);
      if (insErr) throw insErr;
      setNotice(`Guest "${guestName}" added successfully.`);
      setModalOpen(false);
      setGuestName(''); setGuestEmail(''); setGuestPhone(''); setGuestIdNum('');
      await fetchReservationsAndFixtures(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to save guest.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from('reservations').insert([{
        hotel_id: hotelId,
        guest_id: resGuestId,
        room_id: resRoomId,
        check_in_date: resCheckIn,
        check_out_date: resCheckOut,
        adults: parseInt(resAdults) || 1,
        agreed_rate: parseFloat(resRate) || 0,
        status: 'confirmed'
      }]);
      if (insErr) throw insErr;
      setNotice('Reservation booked successfully.');
      setModalOpen(false);
      await fetchReservationsAndFixtures(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to book reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleName === 'Rooms') {
    return (
      <div className="module-view-container">
        {error && <div className="alert-banner error"><strong>Error:</strong> {error}</div>}
        {notice && <div className="alert-banner success">{notice}</div>}

        <div className="module-topbar">
          <div>
            <h2>Rooms Inventory</h2>
            <p className="subtitle">Manage hotel rooms, floor placement, status, and room types.</p>
          </div>
          {canManage && (
            <button onClick={() => { setEditingRoom(null); setRoomNumber(''); setModalOpen(true); }} className="btn-primary">
              + Add New Room
            </button>
          )}
        </div>

        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Hotel Room'}</h3>
                <button onClick={() => setModalOpen(false)} className="modal-close">&times;</button>
              </div>
              <form onSubmit={handleSaveRoom} className="modal-form">
                <div className="form-group">
                  <label>Room Number / Name *</label>
                  <input type="text" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 101" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Floor</label>
                  <input type="text" value={roomFloor} onChange={(e) => setRoomFloor(e.target.value)} placeholder="1" className="form-control" />
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="form-control">
                    <option value="">-- Select Room Type --</option>
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>{rt.name} (UGX {rt.base_rate?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={roomStatus} onChange={(e) => setRoomStatus(e.target.value as Room['status'])} className="form-control">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Room'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="data-card">
          <div className="data-card-header">
            <h3>Active Rooms ({rooms.length})</h3>
            <span className="tenant-badge">Database Backed (RLS)</span>
          </div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Floor</th>
                  <th>Room Type & Rate</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-row">Loading rooms...</td></tr>
                ) : rooms.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">No rooms configured yet.</td></tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id}>
                      <td><strong>Room {room.room_number}</strong></td>
                      <td>Floor {room.floor || '1'}</td>
                      <td>
                        {room.room_type ? (
                          <div>
                            <span className="room-type-name">{room.room_type.name}</span>
                            <div className="room-rate">UGX {Number(room.room_type.base_rate).toLocaleString()}</div>
                          </div>
                        ) : <span className="text-muted">Standard</span>}
                      </td>
                      <td><span className={`status-badge ${room.status}`}>{room.status.replace('_', ' ')}</span></td>
                      <td className="text-right">
                        {canManage && <button className="action-link edit" onClick={() => { setEditingRoom(room); setRoomNumber(room.room_number); setRoomFloor(room.floor || '1'); setRoomTypeId(room.room_type_id || ''); setRoomStatus(room.status); setModalOpen(true); }}>Edit</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (moduleName === 'Reservations') {
    const [subModal, setSubModal] = useState<'guest' | 'reservation'>('reservation');

    return (
      <div className="module-view-container">
        {error && <div className="alert-banner error"><strong>Error:</strong> {error}</div>}
        {notice && <div className="alert-banner success">{notice}</div>}

        <div className="module-topbar">
          <div>
            <h2>Reservations & Guests</h2>
            <p className="subtitle">Manage guest records, bookings, check-in, and availability.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setSubModal('guest'); setModalOpen(true); }} className="btn-secondary">+ Add Guest</button>
            <button onClick={() => { setSubModal('reservation'); setModalOpen(true); }} className="btn-primary">+ New Booking</button>
          </div>
        </div>

        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{subModal === 'guest' ? 'Register New Guest' : 'New Reservation Booking'}</h3>
                <button onClick={() => setModalOpen(false)} className="modal-close">&times;</button>
              </div>

              {subModal === 'guest' ? (
                <form onSubmit={handleSaveGuest} className="modal-form">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="john@example.com" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="text" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+256..." className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>ID / Passport Number</label>
                    <input type="text" value={guestIdNum} onChange={(e) => setGuestIdNum(e.target.value)} placeholder="CM..." className="form-control" />
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Guest'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveReservation} className="modal-form">
                  <div className="form-group">
                    <label>Select Guest *</label>
                    <select required value={resGuestId} onChange={(e) => setResGuestId(e.target.value)} className="form-control">
                      <option value="">-- Choose Guest --</option>
                      {guests.map((g) => <option key={g.id} value={g.id}>{g.full_name} ({g.phone || 'No phone'})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Room *</label>
                    <select required value={resRoomId} onChange={(e) => setResRoomId(e.target.value)} className="form-control">
                      <option value="">-- Choose Room --</option>
                      {rooms.map((r) => <option key={r.id} value={r.id}>Room {r.room_number} ({r.status})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Check-in Date *</label>
                    <input type="date" required value={resCheckIn} onChange={(e) => setResCheckIn(e.target.value)} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Check-out Date *</label>
                    <input type="date" required value={resCheckOut} onChange={(e) => setResCheckOut(e.target.value)} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Agreed Rate (UGX) *</label>
                    <input type="number" required value={resRate} onChange={(e) => setResRate(e.target.value)} className="form-control" />
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Booking...' : 'Confirm Booking'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header">
            <h3>Active Bookings ({reservations.length})</h3>
            <span className="tenant-badge">Database Backed</span>
          </div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Dates</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">No reservations found. Click "+ New Booking" to create one.</td></tr>
                ) : (
                  reservations.map((res: any) => (
                    <tr key={res.id}>
                      <td><strong>{res.guest?.full_name || 'Guest'}</strong></td>
                      <td>Room {res.room?.room_number || 'N/A'}</td>
                      <td>{res.check_in_date} to {res.check_out_date}</td>
                      <td>UGX {Number(res.agreed_rate).toLocaleString()}</td>
                      <td><span className={`status-badge ${res.status}`}>{res.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>Registered Guests ({guests.length})</h3>
            <span className="tenant-badge">Database Backed</span>
          </div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>ID Number</th>
                </tr>
              </thead>
              <tbody>
                {guests.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">No guests registered yet. Click "+ Add Guest".</td></tr>
                ) : (
                  guests.map((g) => (
                    <tr key={g.id}>
                      <td><strong>{g.full_name}</strong></td>
                      <td>{g.email || '—'}</td>
                      <td>{g.phone || '—'}</td>
                      <td>{g.id_number || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="data-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>{moduleName} Module</h2>
        <p className="subtitle" style={{ margin: '8px 0 20px' }}>
          This module is scaffolded and scheduled for implementation in upcoming phases.
        </p>
        <span className="tenant-badge">Scheduled</span>
      </div>
    </div>
  );
};
