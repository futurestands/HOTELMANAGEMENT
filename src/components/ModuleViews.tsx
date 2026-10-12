import React, { useState } from 'react';

interface ModuleViewProps {
  moduleName: string;
}

export const ModuleViews: React.FC<ModuleViewProps> = ({ moduleName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(`Successfully recorded new ${moduleName.slice(0, -1).toLowerCase()} entry!`);
    setModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="module-container">
      {successMessage && <div className="success-banner">{successMessage}</div>}

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
            <h3>New {moduleName.slice(0, -1)} Record</h3>
            <form onSubmit={handleAction} className="modal-form">
              <div className="form-field">
                <label>Name / Reference</label>
                <input type="text" required placeholder="Enter name or code" className="form-input" />
              </div>
              <div className="form-field">
                <label>Category / Details</label>
                <input type="text" required placeholder="Enter description or amount" className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setModalOpen(false)} className="secondary">Cancel</button>
                <button type="submit" className="primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h2>Active {moduleName} Records</h2>
          <span className="badge">UGX Currency Active</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Name / Guest</th>
                <th>Status / Category</th>
                <th>Rate / Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#HMS-1001</td>
                <td><strong>Kampala Suites</strong></td>
                <td><span className="tag">Confirmed</span></td>
                <td>UGX 450,000</td>
                <td>
                  <button className="table-btn">View</button>
                  <button className="table-btn edit">Edit</button>
                </td>
              </tr>
              <tr>
                <td>#HMS-1002</td>
                <td><strong>John Okello</strong></td>
                <td><span className="tag warning">Checked In</span></td>
                <td>UGX 280,000</td>
                <td>
                  <button className="table-btn">View</button>
                  <button className="table-btn edit">Edit</button>
                </td>
              </tr>
              <tr>
                <td>#HMS-1003</td>
                <td><strong>Nile Restaurant POS</strong></td>
                <td><span className="tag success">Settled</span></td>
                <td>UGX 125,000</td>
                <td>
                  <button className="table-btn">View</button>
                  <button className="table-btn edit">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .module-container { display: flex; flexDirection: column; gap: 20px; }
        .success-banner { background: #edfdf4; color: #027a48; border: 1px solid #abefc6; padding: 12px 16px; borderRadius: 10px; font-weight: 600; font-size: 14px; }
        .module-header-actions { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .search-input { padding: 10px 14px; borderRadius: 10px; border: 1px solid #cbd5e1; width: 280px; font-size: 14px; outline: none; background: white; }
        .table-card { background: white; border: 1px solid #e8ebf1; border-radius: 14px; overflow: hidden; box-shadow: 0 3px 14px rgba(15,23,42,.03); }
        .table-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .table-responsive { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .data-table th { background: #f8fafc; padding: 14px 20px; color: #475569; font-weight: 650; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 10px; borderRadius: 999px; font-size: 12px; font-weight: 600; }
        .tag { font-size: 11px; padding: 4px 8px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-weight: 600; }
        .tag.warning { background: #fef3c7; color: #b45309; }
        .tag.success { background: #dcfce7; color: #15803d; }
        .table-btn { background: #f1f5f9; border: none; padding: 6px 10px; borderRadius: 6px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; margin-right: 6px; }
        .table-btn.edit { background: #e0f2fe; color: #0369a1; }
        .table-btn:hover { opacity: 0.85; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: grid; place-items: center; z-index: 100; }
        .modal-content { background: white; padding: 30px; borderRadius: 16px; width: 100%; maxWidth: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-form { display: flex; flexDirection: column; gap: 16px; margin-top: 16px; }
        .form-field { display: flex; flexDirection: column; gap: 6px; }
        .form-field label { font-size: 13px; font-weight: 600; color: #334155; }
        .form-input { padding: 10px 12px; borderRadius: 8px; border: 1px solid #cbd5e1; font-size: 14px; outline: none; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
        .secondary { background: #f1f5f9; color: #475569; border: none; padding: 10px 16px; borderRadius: 8px; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  );
};
