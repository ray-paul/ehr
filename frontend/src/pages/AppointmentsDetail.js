// frontend/src/pages/AppointmentDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { appointmentsService } from '../services/appointments';
import { authService } from '../services/auth';

const AppointmentDetail = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const data = await appointmentsService.get(id);
      setAppointment(data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await appointmentsService.addMessage(id, newMessage);
      setNewMessage('');
      fetchAppointment(); // Refresh to get new messages
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleProposeTime = async () => {
    if (!proposedTime) return;
    
    try {
      await appointmentsService.proposeTime(id, proposedTime);
      setProposedTime('');
      fetchAppointment();
    } catch (error) {
      console.error('Error proposing time:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      await appointmentsService.confirm(id);
      fetchAppointment();
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  if (loading) return <div>Loading appointment...</div>;
  if (!appointment) return <div>Appointment not found</div>;

  const isProvider = currentUser.user_type === 'doctor';
  const canPropose = isProvider && appointment.status === 'requested';
  const canConfirm = !isProvider && appointment.status === 'proposed';

  return (
    <div>
      <h1>Appointment: {appointment.title}</h1>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Details</h5>
          <p><strong>Status:</strong> <span className="badge bg-secondary">{appointment.status}</span></p>
          <p><strong>Patient:</strong> {appointment.patient_name}</p>
          <p><strong>Provider:</strong> {appointment.provider_name}</p>
          <p><strong>Patient Suggested:</strong> {new Date(appointment.patient_suggested_date).toLocaleString()}</p>
          {appointment.provider_proposed_date && (
            <p><strong>Provider Proposed:</strong> {new Date(appointment.provider_proposed_date).toLocaleString()}</p>
          )}
          {appointment.confirmed_date && (
            <p><strong>Confirmed:</strong> {new Date(appointment.confirmed_date).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Actions</h5>
          
          {canPropose && (
            <div className="mb-3">
              <label className="form-label">Propose New Time</label>
              <div className="input-group">
                <input
                  type="datetime-local"
                  className="form-control"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                />
                <button className="btn btn-warning" onClick={handleProposeTime}>
                  Propose Time
                </button>
              </div>
            </div>
          )}

          {canConfirm && (
            <button className="btn btn-success me-2" onClick={handleConfirm}>
              Confirm Appointment
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Communication</h5>
          
          <div className="mb-3">
            {appointment.messages.map(message => (
              <div key={message.id} className="border-bottom pb-2 mb-2">
                <strong>{message.sender_name}:</strong> {message.message}
                <br />
                <small className="text-muted">
                  {new Date(message.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>

          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;