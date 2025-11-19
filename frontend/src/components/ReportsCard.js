import React, { useEffect, useState } from 'react';
import { reportsService } from '../services/reports';
import { authService } from '../services/auth';

const ReportsCard = ({ patientId = null }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async (reportId, file, attachment_type) => {
    if (!isProvider) return;
    if (!file) return;
    setUploading(true);
    try {
      await reportsService.uploadAttachment(reportId, file, attachment_type);
      await load(patientId);
    } catch (err) {
      console.error('Upload failed', err);
      setError(err);
    } finally {
      setUploading(false);
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
            <li key={r.id} style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>{r.title}{r.patient_name ? ` — ${r.patient_name}` : ''}</span>
                <div>
                  {isProvider && <button onClick={() => handleDelete(r.id)}>Delete</button>}
                </div>
              </div>
              {r.attachments && r.attachments.length > 0 && (
                <div className="attachments">
                  <strong>Attachments:</strong>
                  <ul>
                    {r.attachments.map(a => (
                      <li key={a.id}>
                        <a href={a.url} target="_blank" rel="noreferrer">{a.file_name || a.attachment_type}</a>
                        <span style={{marginLeft: '8px', color: '#666'}}>{a.attachment_type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isProvider && (
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <select id={`attach-type-${r.id}`} defaultValue="lab">
                    <option value="lab">Lab Report</option>
                    <option value="escript">E-Script</option>
                    <option value="radiography">Radiography</option>
                    <option value="diagnostic">Diagnostic Report</option>
                  </select>
                  <input id={`attach-file-${r.id}`} type="file" />
                  <button onClick={() => {
                    const f = document.getElementById(`attach-file-${r.id}`).files[0];
                    const t = document.getElementById(`attach-type-${r.id}`).value;
                    handleUpload(r.id, f, t);
                  }} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportsCard;
