// frontend/src/pages/Appointments.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsService } from '../services/appointments';

const AppointmentCard = ({ appt }) => {
  const statusColor = appointmentsService.getStatusColor(appt.status);
  const statusText = appointmentsService.getStatusText(appt.status);

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title">{appt.title || 'Untitled Appointment'}</h5>
            <p className="card-text mb-1">
              <strong>Patient:</strong> {appt.patient_name || appt.patient || 'Unknown'}
            </p>
            <p className="card-text mb-1">
              <strong>Provider:</strong> {appt.provider_name || 'Unknown'}
            </p>
            <p className="card-text mb-1">
              <strong>Suggested:</strong> {appt.patient_suggested_date ? new Date(appt.patient_suggested_date).toLocaleString() : 'TBD'}
            </p>
            {appt.provider_proposed_date && (
              <p className="card-text mb-1">
                <strong>Proposed:</strong> {new Date(appt.provider_proposed_date).toLocaleString()}
              </p>
            )}
            <span className={`badge bg-${statusColor}`}>{statusText}</span>
          </div>
          <div>
            <Link to={`/appointments/${appt.id}`} className="btn btn-primary btn-sm">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchAppointments = async () => {
      try {
        const data = await appointmentsService.list();
        if (mounted) setAppointments(data);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        // Fallback to sample data if backend not available
        if (mounted) setAppointments(appointmentsService.getFallbackData());
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAppointments();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Appointments</h1>
        <Link to="/appointments/new" className="btn btn-primary">
          New Appointment
        </Link>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading appointments...</p>
        </div>
      ) : (
        <div>
          {appointments.length === 0 ? (
            <div className="text-center mt-5">
              <h4>No appointments found</h4>
              <p>Get started by creating your first appointment.</p>
              <Link to="/appointments/new" className="btn btn-primary">
                Create First Appointment
              </Link>
            </div>
          ) : (
            <div>
              {appointments.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Appointments;