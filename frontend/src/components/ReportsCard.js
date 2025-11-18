import React, { useEffect, useState } from 'react';
import { reportsService } from '../services/reports';

const ReportsCard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
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
