import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsService } from '../../services/appointments';

const AppointmentForm = () => {
  const [form, setForm] = useState({ title: '', patient: '', scheduled: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await appointmentsService.create(form);
      navigate('/appointments');
    } catch (err) {
      setError('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>New Appointment</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 w-[270px] block" />
        </div>
        <div className="mb-3">
          <label className="form-label">Patient</label>
          <input name="patient" value={form.patient} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 w-[270px] block" />
        </div>
        <div className="mb-3">
          <label className="form-label">Scheduled</label>
          <input name="scheduled" value={form.scheduled} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 w-[270px] block" placeholder="YYYY-MM-DD HH:MM" />
        </div>
        <div className="flex justify-end">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
