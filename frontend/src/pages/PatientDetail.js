import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReportsCard from '../components/ReportsCard';
import api from '../services/api';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // The patients router mounts under /api/patients/, and the viewset
        // registers 'patients', so the endpoint is /patients/patients/:id/
        const resp = await api.get(`/patients/patients/${id}/`);
        if (mounted) setPatient(resp.data);
      } catch (err) {
        console.error('Failed to load patient', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div>Loading patient details...</div>;
  if (!patient) return <div>Patient not found</div>;

  // The patient serializer nests user data under `user`.
  const firstName = patient.user?.first_name || patient.first_name || '';
  const lastName = patient.user?.last_name || patient.last_name || '';
  const email = patient.user?.email || patient.email || '';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Patient Details</h1>
        <Link to="/patients" className="btn btn-outline-secondary">Back to Patients</Link>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{firstName} {lastName}</h5>

          <div className="row">
            <div className="col-md-6">
              <p><strong>Date of Birth:</strong> {patient.date_of_birth}</p>
              <p><strong>Gender:</strong> {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</p>
              <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Email:</strong> {email || 'N/A'}</p>
              <p><strong>Created:</strong> {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          {patient.address && (
            <div className="mt-3">
              <strong>Address:</strong>
              <p className="mt-1">{patient.address}</p>
            </div>
          )}

          {patient.emergency_contact && (
            <div className="mt-3">
              <strong>Emergency Contact:</strong>
              <p className="mt-1">{patient.emergency_contact}</p>
            </div>
          )}
        </div>
      </div>

      <section style={{marginTop: 24}}>
        <ReportsCard patientId={id} />
      </section>

      <div className="mt-4">
        <h5>Medical Information</h5>
        <div className="alert alert-info">Clinical notes, medications, and allergies will be displayed here in future updates.</div>
      </div>
    </div>
  );
};

export default PatientDetail;