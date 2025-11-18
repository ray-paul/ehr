import React, { useEffect, useState } from 'react';
import { patientsService } from '../services/patients';

const PatientsDemo = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await patientsService.list();
        if (mounted) setPatients(data);
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
    <div>
      <h3>Patients (demo)</h3>
      {patients.length === 0 && <p>No patients found.</p>}
      <ul>
        {patients.map(p => (
          <li key={p.id}>{p.user.first_name} {p.user.last_name} ({p.user.email})</li>
        ))}
      </ul>
    </div>
  );
};

export default PatientsDemo;
