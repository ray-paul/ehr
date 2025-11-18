import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsService } from '../services/appointments';

// add intersection observer to animate float-cards when in viewport
const useFloatOnView = () => {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.float-card'));
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.2 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

const AppointmentCard = ({ appt }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 float-card">
      <h5 className="text-lg font-semibold">{appt.title || 'Untitled Appointment'}</h5>
      <p className="text-sm text-gray-600">Patient: {appt.patient || 'Unknown'}</p>
      <p className="text-sm text-gray-600">When: {appt.scheduled || appt.date || 'TBD'}</p>
      <div className="mt-3">
        <Link to={`/appointments/${appt.id}`} className="text-blue-600 hover:underline">View</Link>
      </div>
    </div>
  );
};

const Appointments = () => {
  useFloatOnView();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await appointmentsService.list();
        if (mounted) setAppointments(data);
      } catch (err) {
        // If backend not available, fallback to sample data
        if (mounted) setAppointments([
          { id: 1, title: 'General Checkup', patient: 'John Doe', scheduled: '2025-11-20 10:00' },
          { id: 2, title: 'Follow-up', patient: 'Jane Smith', scheduled: '2025-11-21 14:30' }
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Appointments</h1>
        <Link to="/appointments/new" className="btn btn-primary">New Appointment</Link>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          {appointments.length === 0 && <p>No appointments found.</p>}
          <div>
            {appointments.map((a) => (
              <AppointmentCard appt={a} key={a.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
