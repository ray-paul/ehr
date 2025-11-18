import React, { useEffect, useState } from 'react';
import { patientsService } from '../services/patients';
import ReportsCard from './ReportsCard';

const PatientsDemo = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await patientsService.list();
        if (mounted) setPatients(data || []);
      } catch (err) {
        console.error('Failed to load patients', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p>Loading patients...</p>;

  return (
    <div style={{display: 'flex', gap: 24}}>
      <div style={{flex: 1}}>
        <h3>Patients (demo)</h3>
        {patients.length === 0 && <p>No patients found.</p>}
        <ul>
          {patients.map(p => (
            <li key={p.id} style={{cursor: 'pointer'}} onClick={() => setSelected(p.id)}>
              {p.user.first_name} {p.user.last_name} ({p.user.email})
            </li>
          ))}
        </ul>
      </div>

      <div style={{flex: 1}}>
        <ReportsCard patientId={selected} />
      </div>
    </div>
  );
};

export default PatientsDemo;
