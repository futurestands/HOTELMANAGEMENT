import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Room, RoomType, UserRole } from '../types/hotel';

interface ModuleViewProps {
  moduleName: string;
  hotelId?: string;
  userRole?: UserRole;
}

export const ModuleViews: React.FC<ModuleViewProps> = ({ moduleName, hotelId, userRole }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [roomStatus, setRoomStatus] = useState<Room['status']>('available');
  const [submitting, setSubmitting] = useState(false);

  const canManageRooms = ['owner', 'administrator', 'manager', 'receptionist'].includes(userRole || '');

  useEffect(() => {
    if (moduleName === 'Rooms') {
      if (!hotelId) {
        setRooms([]);
        setLoading(false);
        setError('No active hotel selected. Please select a valid hotel membership.');
        return;
      }
      fetchRoomsAndTypes(hotelId);
    }
  }, [moduleName, hotelId]);

  const fetchRoomsAndTypes = async (targetHotelId: string) => {
    if (!supabase) {
      setError('Supabase client is not configured.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: typesData, error: typesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', targetHotelId);

      if (typesError) throw typesError;
      setRoomTypes(typesData || []);

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*, room_type:room_types(*)')
        .eq('hotel_id', targetHotelId)
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms and room types.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (!hotelId) {
      setError('Please select an active hotel before adding rooms.');
      return;
    }
    setEditingRoom(null);
    setRoomNumber('');
    setRoomFloor('1');
    setRoomTypeId(roomTypes.length > 0 ? roomTypes[0].id : '');
    setRoomStatus('available');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setRoomFloor(room.floor || '1');
    setRoomTypeId(room.room_type_id || (roomTypes.length > 0 ? roomTypes[0].id : ''));
    setRoomStatus(room.status);
    setError(null);
    setModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    if (!hotelId) {
      setError('No active hotel selected.');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Room number is required.');
      return;
    }
    if (!canManageRooms) {
      setError('You do not have permission to manage rooms.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const trimmedNum = roomNumber.trim();

      const duplicate = rooms.find(
        r => r.room_number.toLowerCase() === trimmedNum.toLowerCase() && (!editingRoom || r.id !== editingRoom.id)
      );
      if (duplicate) {
        throw new Error(`Room number "${trimmedNum}" already exists in this hotel.`);
      }

      const payload = {
        hotel_id: hotelId,
        room_number: trimmedNum,
        floor: roomFloor.trim(),
        room_type_id: roomTypeId || null,
        status: roomStatus,
        housekeeping_status: 'clean'
      };

      if (editingRoom) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update(payload)
          .eq('id', editingRoom.id)
          .eq('hotel_id', hotelId);

        if (updateError) throw updateError;
        setNotice(`Room "${trimmedNum}" updated successfully.`);
      } else {
        const { error: insertError } = await supabase
          .from('rooms')
          .insert([payload]);

        if (insertError) throw insertError;
        setNotice(`Room "${trimmedNum}" created successfully.`);
      }

      setModalOpen(false);
      await fetchRoomsAndTypes(hotelId);
    } catch (err: any) {
      setError(err.message || 'Database error occurred while saving room.');
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
          {canManageRooms && (
            <button onClick={handleOpenAdd} className="btn-primary">
              + Add New Room
            </button>
          )}
        </div>

        {modalOpen && hotelId && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Hotel Room'}</h3>
                <button onClick={() => setModalOpen(false)} className="modal-close">&times;</button>
              </div>
              <form onSubmit={handleSaveRoom} className="modal-form">
                <div className="form-group">
                  <label>Room Number / Name *</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 101 or Executive Suite"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Floor</label>
                  <input
                    type="text"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(e.target.value)}
                    placeholder="1"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">-- Select Room Type --</option>
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} (UGX {rt.base_rate?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Room Status</label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value as Room['status'])}
                    className="form-control"
                  >
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
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Save Room'}
                  </button>
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
                  <th>Housekeeping</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!hotelId ? (
                  <tr>
                    <td colSpan={6} className="empty-row">No active hotel membership selected.</td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={6} className="empty-row">Loading rooms from database...</td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      <div className="empty-state">
                        <p>No rooms configured for this hotel yet.</p>
                        <small>Click "+ Add New Room" above to add your first room.</small>
                      </div>
                    </td>
                  </tr>
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
                        ) : (
                          <span className="text-muted">Standard</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${room.status}`}>
                          {room.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="housekeeping-badge clean">
                          {room.housekeeping_status || 'clean'}
                        </span>
                      </td>
                      <td className="text-right">
                        {canManageRooms && (
                          <button className="action-link edit" onClick={() => handleOpenEdit(room)}>Edit</button>
                        )}
                        <button className="action-link" onClick={() => alert(`Room ${room.room_number} inspection view.`)}>View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <style>{`
          .module-view-container { display: flex; flex-direction: column; gap: 24px; }
          .alert-banner { padding: 14px 18px; border-radius: 10px; font-weight: 600; font-size: 14px; }
          .alert-banner.error { background: #fff1f0; color: #b42318; border: 1px solid #fecdca; }
          .alert-banner.success { background: #edfdf4; color: #027a48; border: 1px solid #abefc6; }

          .module-topbar { display: flex; justify-content: space-between; align-items: center; background: white; padding: 24px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
          .module-topbar h2 { margin: 0; font-size: 22px; color: #0f172a; }
          .subtitle { margin: 4px 0 0; color: #64748b; font-size: 14px; }

          .btn-primary { background: #0f172a; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
          .btn-primary:hover { background: #1e293b; }
          .btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; }
          .btn-secondary:hover { background: #e2e8f0; }

          .data-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
          .data-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
          .data-card-header h3 { margin: 0; font-size: 16px; color: #0f172a; }
          .tenant-badge { background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }

          .table-wrapper { overflow-x: auto; }
          .pro-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
          .pro-table th { background: #f8fafc; padding: 14px 24px; color: #475569; font-weight: 650; border-bottom: 1px solid #e2e8f0; }
          .pro-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
          .empty-row { text-align: center; padding: 50px !important; color: #64748b; }
          .empty-state { display: flex; flex-direction: column; gap: 4px; align-items: center; }
          .empty-state p { margin: 0; font-size: 15px; font-weight: 600; color: #0f172a; }
          .empty-state small { color: #64748b; }

          .room-type-name { font-weight: 600; color: #0f172a; }
          .room-rate { font-size: 12px; color: #64748b; margin-top: 2px; }

          .status-badge { display: inline-block; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .status-badge.available { background: #dcfce7; color: #15803d; }
          .status-badge.occupied { background: #e0f2fe; color: #0369a1; }
          .status-badge.reserved { background: #fef3c7; color: #b45309; }
          .status-badge.cleaning { background: #f3e8ff; color: #7e22ce; }
          .status-badge.maintenance, .status-badge.out_of_service { background: #fee2e2; color: #b91c1c; }

          .housekeeping-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }

          .text-right { text-align: right; }
          .action-link { background: none; border: none; color: #2563eb; font-weight: 600; font-size: 13px; cursor: pointer; padding: 4px 8px; }
          .action-link:hover { text-decoration: underline; }
          .action-link.edit { color: #0d9488; }

          .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: grid; place-items: center; z-index: 1000; padding: 20px; }
          .modal-card { background: white; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); overflow: hidden; animation: modalPop 0.2s ease-out; }
          @keyframes modalPop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

          .modal-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
          .modal-header h3 { margin: 0; font-size: 18px; color: #0f172a; }
          .modal-close { background: none; border: none; font-size: 24px; color: #64748b; cursor: pointer; }
          .modal-sub { font-size: 13px; color: #64748b; margin: 4px 0 16px; padding: 0 24px; }

          .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
          .form-group { display: flex; flex-direction: column; gap: 6px; }
          .form-group label { font-size: 13px; font-weight: 600; color: #334155; }
          .form-control { padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; background: white; color: #0f172a; transition: border-color 0.2s, box-shadow 0.2s; }
          .form-control:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }

          .modal-footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="data-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>{moduleName} Module</h2>
        <p className="subtitle" style={{ margin: '8px 0 20px' }}>
          This module is scaffolded and scheduled for implementation in Phase 2. Database migrations are verified.
        </p>
        <span className="tenant-badge">Phase 2 Scheduled</span>
      </div>
    </div>
  );
};
