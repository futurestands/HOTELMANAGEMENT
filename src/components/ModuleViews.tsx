import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Room, UserRole } from '../types/hotel';

interface ModuleViewProps {
  moduleName: string;
  hotelId?: string;
  userRole?: UserRole;
}

export const ModuleViews: React.FC<ModuleViewProps> = ({ moduleName, hotelId, userRole }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
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
      fetchRooms(hotelId);
    }
  }, [moduleName, hotelId]);

  const fetchRooms = async (targetHotelId: string) => {
    if (!supabase) {
      setError('Supabase client is not configured.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', targetHotelId)
        .order('room_number', { ascending: true });

      if (fetchError) throw fetchError;
      setRooms(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms.');
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
    setRoomStatus('available');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setRoomFloor(room.floor || '1');
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

      // Check duplicates (excluding current editing room)
      const duplicate = rooms.find(
        r => r.room_number.toLowerCase() === trimmedNum.toLowerCase() && (!editingRoom || r.id !== editingRoom.id)
      );
      if (duplicate) {
        throw new Error(`Room number "${trimmedNum}" already exists in this hotel.`);
      }

      if (editingRoom) {
        // Update existing room
        const { error: updateError } = await supabase
          .from('rooms')
          .update({
            room_number: trimmedNum,
            floor: roomFloor.trim(),
            status: roomStatus
          })
          .eq('id', editingRoom.id)
          .eq('hotel_id', hotelId);

        if (updateError) throw updateError;
        setNotice(`Room "${trimmedNum}" updated successfully.`);
      } else {
        // Insert new room
        const payload = {
          hotel_id: hotelId,
          room_number: trimmedNum,
          floor: roomFloor.trim(),
          status: roomStatus,
          housekeeping_status: 'clean'
        };

        const { error: insertError } = await supabase
          .from('rooms')
          .insert([payload]);

        if (insertError) throw insertError;
        setNotice(`Room "${trimmedNum}" created successfully.`);
      }

      setModalOpen(false);
      await fetchRooms(hotelId);
    } catch (err: any) {
      setError(err.message || 'Database error occurred while saving room.');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleName === 'Rooms') {
    return (
      <div className="module-container">
        {error && <div className="error-banner"><strong>Error:</strong> {error}</div>}
        {notice && <div className="success-banner">{notice}</div>}

        <div className="module-header-actions">
          <div className="info-badge">
            <span>🛏️ Rooms Management (Database Backed)</span>
          </div>
          {canManageRooms ? (
            <button onClick={handleOpenAdd} className="primary">
              + Add New Room
            </button>
          ) : (
            <span className="text-muted">Read-only role ({userRole})</span>
          )}
        </div>

        {modalOpen && hotelId && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Hotel Room'}</h3>
              <p className="modal-sub">Enforces unique room number and RLS policies.</p>
              <form onSubmit={handleSaveRoom} className="modal-form">
                <div className="form-field">
                  <label>Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 101 or Suite A"
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Floor</label>
                  <input
                    type="text"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(e.target.value)}
                    placeholder="1"
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value as Room['status'])}
                    className="form-input"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setModalOpen(false)} className="secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="primary">
                    {submitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Save Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="table-card">
          <div className="table-header">
            <h2>Rooms for Active Hotel</h2>
            <span className="badge">{rooms.length} Rooms Loaded</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Floor</th>
                  <th>Status</th>
                  <th>Housekeeping</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!hotelId ? (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">
                      <div className="empty-state-box">
                        <p>No active hotel membership selected.</p>
                        <small>Please select a hotel from your account settings.</small>
                      </div>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">Loading rooms from database...</td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">
                      <div className="empty-state-box">
                        <p>No rooms found in database for this hotel.</p>
                        <small>Click "+ Add New Room" above to create room records.</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id}>
                      <td><strong>Room {room.room_number}</strong></td>
                      <td>Floor {room.floor || '1'}</td>
                      <td><span className={`tag ${room.status}`}>{room.status}</span></td>
                      <td><span className="badge clean">{room.housekeeping_status || 'clean'}</span></td>
                      <td>
                        {canManageRooms && (
                          <button className="table-btn edit" onClick={() => handleOpenEdit(room)}>Edit</button>
                        )}
                        <button className="table-btn" onClick={() => alert(`Room ${room.room_number} details view.`)}>View</button>
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

  return (
    <div className="module-container">
      <div className="table-card" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>{moduleName} Module</h2>
        <p className="muted" style={{ margin: '12px 0 20px' }}>
          This module is scaffolded and scheduled for implementation in Phase 2. Database migrations are verified.
        </p>
        <span className="badge">Phase 2 Scheduled</span>
      </div>
    </div>
  );
};
