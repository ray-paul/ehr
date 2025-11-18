import React, { useEffect, useState } from 'react';
import { reportsService } from '../services/reports';

const ReportsCard = ({ patientId = null }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
        const load = async (pid) => {
            setLoading(true);
            try {
                const data = await reportsService.list(pid);
                if (mounted) setReports(Array.isArray(data) ? data : data.value || []);
            } catch (err) {
                if (mounted) setError(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
    (async () => {
      try {
        const data = await reportsService.list();
        if (mounted) setReports(data || []);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="reports-card">Loading reports…</div>;
  if (error) return <div className="reports-card">Error loading reports</div>;

  return (
    <div className="reports-card">
      <h3>Reports</h3>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul>
          {reports.map(r => (
            <li key={r.id}>{r.title ?? r.name ?? `Report ${r.id}`}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportsCard;
  // If user is patient and no patientId provided, prompt to select
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
