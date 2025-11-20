// frontend/src/components/appointments/AppointmentForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../../services/appointments';
import api from '../../services/api';

const AppointmentForm = () => {
  const [form, setForm] = useState({ 
    title: '', 
    description: '',
    patient_suggested_date: '', 
    provider: '' 
  });
  const [providers, setProviders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProviders();
    fetchPatients();
  }, []);

  const fetchProviders = async () => {
    try {
      // Fetch users with provider role - you'll need to create this endpoint
      const response = await api.get('/accounts/providers/');
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      // Fallback providers for development
      setProviders([
        { id: 1, first_name: 'John', last_name: 'Smith', specialty: 'General Medicine' },
        { id: 2, first_name: 'Sarah', last_name: 'Johnson', specialty: 'Cardiology' },
        { id: 3, first_name: 'Michael', last_name: 'Brown', specialty: 'Pediatrics' }
      ]);
    }
  };

  const fetchPatients = async () => {
    try {
      // Fetch patients - you'll need to create this endpoint
      const response = await api.get('/patients/patients/');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback patients for development
      setPatients([
        { id: 1, first_name: 'Alice', last_name: 'Williams' },
        { id: 2, first_name: 'David', last_name: 'Miller' },
        { id: 3, first_name: 'Emma', last_name: 'Davis' }
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!form.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!form.patient_suggested_date) {
      setError('Please select a preferred date and time');
      setLoading(false);
      return;
    }

    if (!form.provider) {
      setError('Please select a provider');
      setLoading(false);
      return;
    }

    try {
      // Format the data for the backend
      const payload = {
        title: form.title,
        description: form.description,
        patient_suggested_date: form.patient_suggested_date,
        provider: form.provider
      };

      await appointmentsService.create(payload);
      navigate('/appointments');
    } catch (err) {
      console.error('Appointment creation error:', err);
      setError(err.response?.data?.message || 'Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title mb-0">Request New Appointment</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Appointment Title *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., General Checkup, Follow-up Consultation"
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of your concerns or reason for appointment..."
                  />
                </div>

                {/* Preferred Date & Time */}
                <div className="mb-3">
                  <label htmlFor="patient_suggested_date" className="form-label">
                    Preferred Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="patient_suggested_date"
                    name="patient_suggested_date"
                    value={form.patient_suggested_date}
                    onChange={handleChange}
                    min={getMinDateTime()}
                    required
                  />
                  <div className="form-text">
                    This is your preferred time. The provider may suggest an alternative time.
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="mb-3">
                  <label htmlFor="provider" className="form-label">
                    Select Provider *
                  </label>
                  <select
                    className="form-select"
                    id="provider"
                    name="provider"
                    value={form.provider}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose a provider...</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        Dr. {provider.first_name} {provider.last_name}
                        {provider.specialty && ` - ${provider.specialty}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Selection (if user is admin/staff) */}
                <div className="mb-4">
                  <label htmlFor="patient" className="form-label">
                    Select Patient (Optional)
                  </label>
                  <select
                    className="form-select"
                    id="patient"
                    name="patient"
                    value={form.patient}
                    onChange={handleChange}
                  >
                    <option value="">Select patient (or leave blank for yourself)</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    If you're booking for someone else, select the patient. Otherwise, leave blank to book for yourself.
                  </div>
                </div>

                {/* Buttons */}
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/appointments')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Requesting Appointment...
                      </>
                    ) : (
                      'Request Appointment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Information Card */}
          <div className="card mt-4">
            <div className="card-body">
              <h6 className="card-title">How it works:</h6>
              <ul className="list-unstyled mb-0">
                <li>✓ Request an appointment with your preferred provider</li>
                <li>✓ Suggest your preferred date and time</li>
                <li>✓ The provider will review and may propose an alternative time</li>
                <li>✓ You'll be notified when the appointment is confirmed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;