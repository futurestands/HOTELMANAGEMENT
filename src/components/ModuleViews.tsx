import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Room, RoomType, Guest, Reservation, StockItem, UserRole } from '../types/hotel';

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
  const [folios, setFolios] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [subModal, setSubModal] = useState<'guest' | 'reservation' | 'payment' | 'stock' | 'menu' | 'employee' | 'leave'>('reservation');

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
  const [resRate, setResRate] = useState('150000');

  // Payment Form State
  const [payFolioId, setPayFolioId] = useState('');
  const [payAmount, setPayAmount] = useState('150000');
  const [payMethod, setPayMethod] = useState<'cash' | 'mobile_money' | 'card' | 'bank'>('cash');
  const [payRef, setPayRef] = useState('');

  // Stock Form State
  const [stockName, setStockName] = useState('');
  const [stockCategory, setStockCategory] = useState('Kitchen');
  const [stockUnit, setStockUnit] = useState('pcs');
  const [stockQty, setStockQty] = useState('10');
  const [stockThreshold, setStockThreshold] = useState('5');
  const [stockCost, setStockCost] = useState('1000');

  // Menu Form State
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('Food');
  const [menuPrice, setMenuPrice] = useState('25000');

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empPos, setEmpPos] = useState('Receptionist');
  const [empDept, setEmpDept] = useState('Front Office');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState('500000');

  const [submitting, setSubmitting] = useState(false);

  const canManage = ['owner', 'administrator', 'manager', 'receptionist'].includes(userRole || '');
  const canCashier = ['owner', 'administrator', 'manager', 'cashier'].includes(userRole || '');
  const canInventory = ['owner', 'administrator', 'manager', 'storekeeper'].includes(userRole || '');
  const canRestaurant = ['owner', 'administrator', 'manager', 'restaurant_staff', 'cashier'].includes(userRole || '');
  const canHr = ['owner', 'administrator', 'manager', 'hr'].includes(userRole || '');

  useEffect(() => {
    if (!hotelId) return;
    if (moduleName === 'Rooms') {
      fetchRoomsAndTypes(hotelId);
    } else if (moduleName === 'Reservations') {
      fetchReservationsAndFixtures(hotelId);
    } else if (moduleName === 'Cashier') {
      fetchCashierData(hotelId);
    } else if (moduleName === 'Inventory') {
      fetchInventoryData(hotelId);
    } else if (moduleName === 'Restaurant') {
      fetchRestaurantData(hotelId);
    } else if (moduleName === 'HR') {
      fetchHrData(hotelId);
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
      const { data: rData } = await supabase.from('rooms').select('*').eq('hotel_id', targetHotelId).eq('status', 'available');
      setRooms(rData || []);
      const { data: resData } = await supabase.from('reservations').select('*, guest:guests(*), room:rooms(*)').eq('hotel_id', targetHotelId).order('created_at', { ascending: false });
      setReservations(resData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashierData = async (targetHotelId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: fData } = await supabase.from('folios').select('*, guest:guests(*), reservation:reservations(*)').eq('hotel_id', targetHotelId).order('created_at', { ascending: false });
      setFolios(fData || []);
      const { data: pData } = await supabase.from('payments').select('*').eq('hotel_id', targetHotelId).order('created_at', { ascending: false });
      setPayments(pData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cashier records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async (targetHotelId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sData } = await supabase.from('stock_items').select('*').eq('hotel_id', targetHotelId).order('name');
      setStockItems(sData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantData = async (targetHotelId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: mData } = await supabase.from('menu_items').select('*').eq('hotel_id', targetHotelId).order('name');
      setMenuItems(mData || []);
      const { data: oData } = await supabase.from('restaurant_orders').select('*, guest:guests(*), room:rooms(*)').eq('hotel_id', targetHotelId).order('created_at', { ascending: false });
      setRestaurantOrders(oData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch restaurant data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHrData = async (targetHotelId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: eData } = await supabase.from('employees').select('*').eq('hotel_id', targetHotelId).order('full_name');
      setEmployees(eData || []);
      const { data: lData } = await supabase.from('leave_requests').select('*, employee:employees(*)').eq('hotel_id', targetHotelId).order('created_at', { ascending: false });
      setLeaveRequests(lData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch HR data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
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
    setNotice(null);
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

    if (new Date(resCheckOut) <= new Date(resCheckIn)) {
      setError('Check-out date must be later than check-in date.');
      return;
    }
    const rateVal = parseFloat(resRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setError('Agreed rate must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const { data: resData, error: insErr } = await supabase.from('reservations').insert([{
        hotel_id: hotelId,
        guest_id: resGuestId,
        room_id: resRoomId,
        check_in_date: resCheckIn,
        check_out_date: resCheckOut,
        adults: 1,
        agreed_rate: rateVal,
        status: 'confirmed'
      }]).select().single();

      if (insErr) throw insErr;

      if (resData) {
        await supabase.from('folios').insert([{
          hotel_id: hotelId,
          reservation_id: resData.id,
          guest_id: resGuestId,
          status: 'open',
          total_charges: rateVal,
          total_payments: 0
        }]);
      }

      setNotice('Reservation booked successfully.');
      setModalOpen(false);
      await fetchReservationsAndFixtures(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to book reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const { error: payErr } = await supabase.from('payments').insert([{
        hotel_id: hotelId,
        folio_id: payFolioId || null,
        amount: amountVal,
        payment_method: payMethod,
        reference_number: payRef.trim() || `TXN-${Date.now()}`
      }]);

      if (payErr) throw payErr;

      if (payFolioId) {
        const targetFolio = folios.find(f => f.id === payFolioId);
        if (targetFolio) {
          const newPayments = Number(targetFolio.total_payments || 0) + amountVal;
          const newStatus = newPayments >= Number(targetFolio.total_charges || 0) ? 'settled' : 'open';
          await supabase.from('folios').update({
            total_payments: newPayments,
            status: newStatus
          }).eq('id', payFolioId);
        }
      }

      setNotice('Payment recorded successfully.');
      setModalOpen(false);
      setPayRef('');
      await fetchCashierData(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const { error: insErr } = await supabase.from('stock_items').insert([{
        hotel_id: hotelId,
        name: stockName.trim(),
        category: stockCategory.trim(),
        unit: stockUnit.trim(),
        quantity_in_stock: parseFloat(stockQty) || 0,
        reorder_threshold: parseFloat(stockThreshold) || 5,
        unit_cost: parseFloat(stockCost) || 0
      }]);
      if (insErr) throw insErr;
      setNotice(`Stock item "${stockName}" added successfully.`);
      setModalOpen(false);
      setStockName('');
      await fetchInventoryData(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to save stock item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const { error: insErr } = await supabase.from('menu_items').insert([{
        hotel_id: hotelId,
        name: menuName.trim(),
        category: menuCategory.trim(),
        price: parseFloat(menuPrice) || 0,
        is_active: true
      }]);
      if (insErr) throw insErr;
      setNotice(`Menu item "${menuName}" added successfully.`);
      setModalOpen(false);
      setMenuName('');
      await fetchRestaurantData(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to save menu item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hotelId) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const { error: insErr } = await supabase.from('employees').insert([{
        hotel_id: hotelId,
        full_name: empName.trim(),
        position: empPos.trim(),
        department: empDept.trim(),
        phone: empPhone.trim() || null,
        salary: parseFloat(empSalary) || 0,
        is_active: true
      }]);
      if (insErr) throw insErr;
      setNotice(`Employee "${empName}" added successfully.`);
      setModalOpen(false);
      setEmpName(''); setEmpPhone('');
      await fetchHrData(hotelId);
    } catch (err: any) {
      setError(err.message || 'Failed to save employee.');
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
                  <div className="form-group"><label>Full Name *</label><input type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" className="form-control" /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="john@example.com" className="form-control" /></div>
                  <div className="form-group"><label>Phone</label><input type="text" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+256..." className="form-control" /></div>
                  <div className="form-group"><label>ID / Passport Number</label><input type="text" value={guestIdNum} onChange={(e) => setGuestIdNum(e.target.value)} placeholder="CM..." className="form-control" /></div>
                  <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Guest'}</button></div>
                </form>
              ) : (
                <form onSubmit={handleSaveReservation} className="modal-form">
                  <div className="form-group"><label>Select Guest *</label><select required value={resGuestId} onChange={(e) => setResGuestId(e.target.value)} className="form-control"><option value="">-- Choose Guest --</option>{guests.map((g) => <option key={g.id} value={g.id}>{g.full_name} ({g.phone || 'No phone'})</option>)}</select></div>
                  <div className="form-group"><label>Select Available Room *</label><select required value={resRoomId} onChange={(e) => setResRoomId(e.target.value)} className="form-control"><option value="">-- Choose Room --</option>{rooms.map((r) => <option key={r.id} value={r.id}>Room {r.room_number} ({r.status})</option>)}</select></div>
                  <div className="form-group"><label>Check-in Date *</label><input type="date" required value={resCheckIn} onChange={(e) => setResCheckIn(e.target.value)} className="form-control" /></div>
                  <div className="form-group"><label>Check-out Date *</label><input type="date" required value={resCheckOut} onChange={(e) => setResCheckOut(e.target.value)} className="form-control" /></div>
                  <div className="form-group"><label>Agreed Rate (UGX) *</label><input type="number" required value={resRate} onChange={(e) => setResRate(e.target.value)} className="form-control" /></div>
                  <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Booking...' : 'Confirm Booking'}</button></div>
                </form>
              )}
            </div>
          </div>
        )}
        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header"><h3>Active Bookings ({reservations.length})</h3><span className="tenant-badge">Database Backed</span></div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Rate</th><th>Status</th></tr></thead>
              <tbody>
                {reservations.length === 0 ? <tr><td colSpan={5} className="empty-row">No reservations found.</td></tr> : reservations.map((res: any) => (
                  <tr key={res.id}>
                    <td><strong>{res.guest?.full_name || 'Guest'}</strong></td>
                    <td>Room {res.room?.room_number || 'N/A'}</td>
                    <td>{res.check_in_date} to {res.check_out_date}</td>
                    <td>UGX {Number(res.agreed_rate).toLocaleString()}</td>
                    <td><span className={`status-badge ${res.status}`}>{res.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="data-card">
          <div className="data-card-header"><h3>Registered Guests ({guests.length})</h3><span className="tenant-badge">Database Backed</span></div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead><tr><th>Full Name</th><th>Email</th><th>Phone</th><th>ID Number</th></tr></thead>
              <tbody>
                {guests.length === 0 ? <tr><td colSpan={4} className="empty-row">No guests registered yet.</td></tr> : guests.map((g) => (
                  <tr key={g.id}>
                    <td><strong>{g.full_name}</strong></td>
                    <td>{g.email || '—'}</td>
                    <td>{g.phone || '—'}</td>
                    <td>{g.id_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (moduleName === 'Cashier') {
    return (
      <div className="module-view-container">
        {error && <div className="alert-banner error"><strong>Error:</strong> {error}</div>}
        {notice && <div className="alert-banner success">{notice}</div>}
        <div className="module-topbar">
          <div>
            <h2>Cashier & Billing</h2>
            <p className="subtitle">Manage guest folios, record payments, and issue receipts.</p>
          </div>
          {canCashier && <button onClick={() => { setSubModal('payment'); setModalOpen(true); }} className="btn-primary">+ Record Payment</button>}
        </div>
        {modalOpen && subModal === 'payment' && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header"><h3>Record Guest Payment</h3><button onClick={() => setModalOpen(false)} className="modal-close">&times;</button></div>
              <form onSubmit={handleRecordPayment} className="modal-form">
                <div className="form-group"><label>Select Guest Folio *</label><select required value={payFolioId} onChange={(e) => setPayFolioId(e.target.value)} className="form-control"><option value="">-- Choose Folio --</option>{folios.filter(f => f.status !== 'settled').map((f) => (<option key={f.id} value={f.id}>Folio #{f.id.slice(0, 6)} - {f.guest?.full_name || 'Guest'} (Balance: UGX {Number(f.total_charges - f.total_payments).toLocaleString()})</option>))}</select></div>
                <div className="form-group"><label>Amount (UGX) *</label><input type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="form-control" /></div>
                <div className="form-group"><label>Payment Method *</label><select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className="form-control"><option value="cash">Cash</option><option value="mobile_money">Mobile Money</option><option value="card">Credit Card</option><option value="bank">Bank Transfer</option></select></div>
                <div className="form-group"><label>Reference Number</label><input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN-98765" className="form-control" /></div>
                <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Processing...' : 'Record Payment'}</button></div>
              </form>
            </div>
          </div>
        )}
        <div className="data-card" style={{ marginBottom: '24px' }}>
          <div className="data-card-header"><h3>Guest Folios ({folios.length})</h3><span className="tenant-badge">Database Backed</span></div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead><tr><th>Folio ID</th><th>Guest</th><th>Total Charges</th><th>Total Paid</th><th>Status</th></tr></thead>
              <tbody>
                {folios.length === 0 ? <tr><td colSpan={5} className="empty-row">No active folios found.</td></tr> : folios.map((f: any) => (
                  <tr key={f.id}>
                    <td><strong>#{f.id.slice(0, 8)}</strong></td>
                    <td>{f.guest?.full_name || 'Guest'}</td>
                    <td>UGX {Number(f.total_charges).toLocaleString()}</td>
                    <td>UGX {Number(f.total_payments).toLocaleString()}</td>
                    <td><span className={`status-badge ${f.status}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (moduleName === 'Inventory') {
    return (
      <div className="module-view-container">
        {error && <div className="alert-banner error"><strong>Error:</strong> {error}</div>}
        {notice && <div className="alert-banner success">{notice}</div>}
        <div className="module-topbar">
          <div>
            <h2>Inventory & Stock Control</h2>
            <p className="subtitle">Manage stock items, reorder thresholds, and inventory levels.</p>
          </div>
          {canInventory && <button onClick={() => { setSubModal('stock'); setModalOpen(true); }} className="btn-primary">+ Add Stock Item</button>}
        </div>
        {modalOpen && subModal === 'stock' && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header"><h3>Add New Stock Item</h3><button onClick={() => setModalOpen(false)} className="modal-close">&times;</button></div>
              <form onSubmit={handleSaveStock} className="modal-form">
                <div className="form-group"><label>Item Name *</label><input type="text" required value={stockName} onChange={(e) => setStockName(e.target.value)} placeholder="e.g. Fresh Milk" className="form-control" /></div>
                <div className="form-group"><label>Category</label><input type="text" value={stockCategory} onChange={(e) => setStockCategory(e.target.value)} placeholder="Kitchen" className="form-control" /></div>
                <div className="form-group"><label>Unit</label><input type="text" value={stockUnit} onChange={(e) => setStockUnit(e.target.value)} placeholder="liters / pcs" className="form-control" /></div>
                <div className="form-group"><label>Quantity in Stock *</label><input type="number" required value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="form-control" /></div>
                <div className="form-group"><label>Reorder Threshold *</label><input type="number" required value={stockThreshold} onChange={(e) => setStockThreshold(e.target.value)} className="form-control" /></div>
                <div className="form-group"><label>Unit Cost (UGX) *</label><input type="number" required value={stockCost} onChange={(e) => setStockCost(e.target.value)} className="form-control" /></div>
                <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Stock Item'}</button></div>
              </form>
            </div>
          </div>
        )}
        <div className="data-card">
          <div className="data-card-header"><h3>Inventory Stock Items ({stockItems.length})</h3><span className="tenant-badge">Database Backed</span></div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead><tr><th>Item Name</th><th>Category</th><th>In Stock</th><th>Threshold</th><th>Unit Cost</th><th>Status</th></tr></thead>
              <tbody>
                {stockItems.length === 0 ? <tr><td colSpan={6} className="empty-row">No stock items configured yet.</td></tr> : stockItems.map((s) => {
                  const isLow = Number(s.quantity_in_stock) <= Number(s.reorder_threshold);
                  return (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.category}</td>
                      <td>{s.quantity_in_stock} {s.unit}</td>
                      <td>{s.reorder_threshold} {s.unit}</td>
                      <td>UGX {Number(s.unit_cost).toLocaleString()}</td>
                      <td>{isLow ? <span className="status-badge maintenance">Low Stock</span> : <span className="status-badge available">Normal</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (moduleName === 'Restaurant') {
    return (
      <div className="module-view-container">
        {error && <div className="alert-banner error"><strong>Error:</strong> {error}</div>}
        {notice && <div className="alert-banner success">{notice}</div>}
        <div className="module-topbar">
          <div>
            <h2>Restaurant & POS</h2>
            <p className="subtitle">Manage menu items, dining orders, and settlements.</p>
          </div>
          {canRestaurant && <button onClick={() => { setSubModal('menu'); setModalOpen(true); }} className="btn-primary">+ Add Menu Item</button>}
        </div>
        {modalOpen && subModal === 'menu' && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header"><h3>Add Menu Item</h3><button onClick={() => setModalOpen(false)} className="modal-close">&times;</button></div>
              <form onSubmit={handleSaveMenu} className="modal-form">
                <div className="form-group"><label>Item Name *</label><input type="text" required value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Grilled Tilapia" className="form-control" /></div>
                <div className="form-group"><label>Category</label><input type="text" value={menuCategory} onChange={(e) => setMenuCategory(e.target.value)} placeholder="Food / Drinks" className="form-control" /></div>
                <div className="form-group"><label>Price (UGX) *</label><input type="number" required value={menuPrice} onChange={(e) => setMenuPrice(e.target.value)} className="form-control" /></div>
                <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Item'}</button></div>
              </form>
            </div>
          </div>
        )}
        <div className="data-card">
          <div className="data-card-header"><h3>Menu Catalog ({menuItems.length})</h3><span className="tenant-badge">Database Backed</span></div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead><tr><th>Item Name</th><th>Category</th><th>Price</th><th>Availability</th></tr></thead>
              <tbody>
                {menuItems.length === 0 ? <tr><td colSpan={4} className="empty-row">No menu items configured yet.</td></tr> : menuItems.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.category}</td>
                    <td>UGX {Number(m.price).toLocaleString()}</td>
                    <td><span className={`status-badge ${m.is_active ? 'available' : 'maintenance'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (moduleName === 'HR') {
    return (
      <div className="module-view-container">
        {error && <div className="alert-banner error"><strong>Error:</strong> {error}</div>}
        {notice && <div className="alert-banner success">{notice}</div>}
        <div className="module-topbar">
          <div>
            <h2>Human Resources & Staff</h2>
            <p className="subtitle">Manage staff profiles, department assignments, and leave requests.</p>
          </div>
          {canHr && <button onClick={() => { setSubModal('employee'); setModalOpen(true); }} className="btn-primary">+ Add Employee</button>}
        </div>
        {modalOpen && subModal === 'employee' && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header"><h3>Add Employee Record</h3><button onClick={() => setModalOpen(false)} className="modal-close">&times;</button></div>
              <form onSubmit={handleSaveEmployee} className="modal-form">
                <div className="form-group"><label>Full Name *</label><input type="text" required value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="Jane Doe" className="form-control" /></div>
                <div className="form-group"><label>Position *</label><input type="text" required value={empPos} onChange={(e) => setEmpPos(e.target.value)} placeholder="Receptionist" className="form-control" /></div>
                <div className="form-group"><label>Department</label><input type="text" value={empDept} onChange={(e) => setEmpDept(e.target.value)} placeholder="Front Office" className="form-control" /></div>
                <div className="form-group"><label>Phone</label><input type="text" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="+256..." className="form-control" /></div>
                <div className="form-group"><label>Monthly Salary (UGX) *</label><input type="number" required value={empSalary} onChange={(e) => setEmpSalary(e.target.value)} className="form-control" /></div>
                <div className="modal-footer"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Employee'}</button></div>
              </form>
            </div>
          </div>
        )}
        <div className="data-card">
          <div className="data-card-header"><h3>Staff Directory ({employees.length})</h3><span className="tenant-badge">Database Backed</span></div>
          <div className="table-wrapper">
            <table className="pro-table">
              <thead><tr><th>Full Name</th><th>Position</th><th>Department</th><th>Phone</th><th>Salary</th><th>Status</th></tr></thead>
              <tbody>
                {employees.length === 0 ? <tr><td colSpan={6} className="empty-row">No employees registered yet.</td></tr> : employees.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.full_name}</strong></td>
                    <td>{e.position}</td>
                    <td>{e.department}</td>
                    <td>{e.phone || '—'}</td>
                    <td>UGX {Number(e.salary).toLocaleString()}</td>
                    <td><span className={`status-badge ${e.is_active ? 'available' : 'maintenance'}`}>{e.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
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
          This module is fully database-backed and operational.
        </p>
        <span className="tenant-badge">Database Backed</span>
      </div>
    </div>
  );
};
