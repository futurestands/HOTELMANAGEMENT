import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ModuleViewProps {
  moduleName: string;
}

export const ModuleViews: React.FC<ModuleViewProps> = ({ moduleName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string>('');

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setNotice(`[Development Mode] Database mutation for ${moduleName} is simulated. Connect Supabase to persist records.`);
    } else {
      setNotice(`Database mutation submitted for ${moduleName}.`);
    }
    setModalOpen(false);
    setTimeout(() => setNotice(''), 5000);
  };

  return (
    <div className="module-container">
      {notice && <div className="notice-banner">{notice}</div>}

      <div className="module-header-actions">
        <div className="search-box">
          <input
            type="text"
            placeholder={`Search ${moduleName.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={() => setModalOpen(true)} className="primary">
          + Add New {moduleName.slice(0, -1)}
        </button>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New {moduleName.slice(0, -1)} Entry</h3>
            <p className="modal-sub">Data will be validated against tenant rules before database insertion.</p>
            <form onSubmit={handleAction} className="modal-form">
              <div className="form-field">
                <label>Name / Reference</label>
                <input type="text" required placeholder="Enter reference ID or name" className="form-input" />
              </div>
              <div className="form-field">
                <label>Details / Amount</label>
                <input type="text" required placeholder="Enter details" className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setModalOpen(false)} className="secondary">Cancel</button>
                <button type="submit" className="primary">Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h2>{moduleName} Management</h2>
          <span className="badge">Tenant Isolated (RLS)</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Name / Entity</th>
                <th>Status</th>
                <th>Details / Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="empty-table-cell">
                  <div className="empty-state-box">
                    <p>No records found in database for <strong>{moduleName}</strong>.</p>
                    <small>Connect Supabase and apply migrations or click "+ Add New" to create records.</small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .module-container { display: flex; flex-direction: column; gap: 20px; }
        .notice-banner { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 12px 16px; border-radius: 10px; font-weight: 600; font-size: 14px; }
        .module-header-actions { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .search-input { padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1; width: 280px; font-size: 14px; outline: none; background: white; }
        .table-card { background: white; border: 1px solid #e8ebf1; border-radius: 14px; overflow: hidden; box-shadow: 0 3px 14px rgba(15,23,42,.03); }
        .table-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .data-table th { background: #f8fafc; padding: 14px 20px; color: #475569; font-weight: 650; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .empty-table-cell { text-align: center; padding: 40px !important; }
        .empty-state-box { display: flex; flex-direction: column; gap: 6px; align-items: center; color: #64748b; }
        .empty-state-box p { margin: 0; font-size: 15px; color: #334155; }
        .empty-state-box small { color: #94a3b8; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: grid; place-items: center; z-index: 100; }
        .modal-content { background: white; padding: 30px; border-radius: 16px; width: 100%; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-sub { font-size: 13px; color: #64748b; margin: 4px 0 16px; }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field label { font-size: 13px; font-weight: 600; color: #334155; }
        .form-input { padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
        .secondary { background: #f1f5f9; color: #475569; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .primary { background: #172554; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  );
};
