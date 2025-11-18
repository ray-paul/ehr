import React, { useEffect, useState } from 'react';
import { reportsService } from '../services/reports';
import { authService } from '../services/auth';

const ReportsCard = ({ patientId = null }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const currentUser = authService.getCurrentUser() || {};
  const isProvider = ['doctor', 'nurse', 'admin'].includes(currentUser.user_type);

  const load = async (pid) => {
    setLoading(true);
    try {
      const data = await reportsService.list(pid);
      const list = Array.isArray(data) ? data : (data.results || data.value || []);
      setReports(list);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!patientId && currentUser.user_type === 'patient') {
      setReports([]);
      setLoading(false);
      return;
    }
    load(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleCreate = async () => {
    if (!isProvider) return;
    const title = window.prompt('Report title');
    if (!title) return;
    const content = window.prompt('Report content (optional)') || '';
    setCreating(true);
    try {
      await reportsService.create({ title, content, patient: patientId });
      await load(patientId);
    } catch (err) {
      console.error('Create failed', err);
      setError(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isProvider) return;
    if (!window.confirm('Delete this report?')) return;
    try {
      await reportsService.delete(id);
      setReports((prev) => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      setError(err);
    }
  };

  if (loading) return <div className="reports-card">Loading reports…</div>;

  if (!patientId && currentUser.user_type === 'patient') {
    return (
      <div className="reports-card">
        <h3>Reports</h3>
        <p>Please open a patient record to view reports.</p>
      </div>
    );
  }

  return (
    <div className="reports-card">
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <h3>Reports</h3>
        {isProvider && <button onClick={handleCreate} disabled={creating}>{creating ? 'Creating…' : 'New Report'}</button>}
      </div>

      {error && <div className="error">Error loading reports</div>}

      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul>
          {reports.map(r => (
            <li key={r.id} style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>{r.title}{r.patient_name ? ` — ${r.patient_name}` : ''}</span>
              {isProvider && <button onClick={() => handleDelete(r.id)}>Delete</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportsCard;
