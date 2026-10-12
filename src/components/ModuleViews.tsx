import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Room } from '../types/hotel';

interface ModuleViewProps {
  moduleName: string;
  hotelId?: string;
  userRole?: string;
}

export const ModuleViews: React.FC<ModuleViewProps> = ({ moduleName, hotelId }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // New Room Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomStatus, setRoomStatus] = useState<Room['status']>('available');
  const [submitting, setSubmitting] = useState(false);

  // Fetch rooms from database if Rooms module is active
  useEffect(() => {
    if (moduleName === 'Rooms') {
      fetchRooms();
    }
  }, [moduleName, hotelId]);

  const fetchRooms = async () => {
    if (!supabase) {
      setError('Supabase client not configured. Cannot fetch database records.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('rooms').select('*');
      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setRooms(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase client not configured.');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Room number is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      // Check duplicate room number
      const existing = rooms.find(r => r.room_number.toLowerCase() === roomNumber.trim().toLowerCase());
      if (existing) {
        throw new Error(`Room number "${roomNumber}" already exists in this hotel.`);
      }

      const payload = {
        hotel_id: hotelId || '00000000-0000-0000-0000-000000000001', // fallback demo id if unlinked
        room_number: roomNumber.trim(),
        floor: roomFloor.trim(),
        status: roomStatus,
        housekeeping_status: 'clean'
      };

      const { data, error: insertError } = await supabase
        .from('rooms')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setNotice(`Room "${data.room_number}" successfully created and verified!`);
      setModalOpen(false);
      setRoomNumber('');
      fetchRooms();
    } catch (err: any) {
      setError(err.message || 'Failed to save room.');
    } finally {
      setSubmitting(false);
    }
  };

  if (moduleName === 'Rooms') {
    return (
      <div className="module-container">
        {error && <div className="error-banner"><strong>Database Error:</strong> {error}</div>}
        {notice && <div className="success-banner">{notice}</div>}

        <div className="module-header-actions">
          <div className="info-badge">
            <span>🛏️ Rooms Module (Database Backed via RLS)</span>
          </div>
          <button onClick={() => setModalOpen(true)} className="primary">
            + Add New Room
          </button>
        </div>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add New Hotel Room</h3>
              <p className="modal-sub">Enforces unique room number per hotel and RLS write policies.</p>
              <form onSubmit={handleCreateRoom} className="modal-form">
                <div className="form-field">
                  <label>Room Number / Name *</label>
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
                  <label>Initial Status</label>
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
                    {submitting ? 'Saving...' : 'Save Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="table-card">
          <div className="table-header">
            <h2>Configured Hotel Rooms</h2>
            <span className="badge">{rooms.length} Rooms Found</span>
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">Loading rooms from database...</td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">
                      <div className="empty-state-box">
                        <p>No rooms configured in the database yet.</p>
                        <small>Click "+ Add New Room" above to insert a room record.</small>
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
          This module is scaffolded and awaiting Phase 2 implementation. Database schema migrations are ready.
        </p>
        <span className="badge">Coming in Phase 2</span>
      </div>
    </div>
  );
};
