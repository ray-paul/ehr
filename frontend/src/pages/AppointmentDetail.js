// frontend/src/pages/AppointmentDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { appointmentsService } from '../services/appointments';
import { authService } from '../services/auth';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
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
    setActionLoading(true);
    
    try {
      await appointmentsService.addMessage(id, newMessage);
      setNewMessage('');
      await fetchAppointment(); // Refresh to get new messages
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeTime = async () => {
    if (!proposedTime) return;
    setActionLoading(true);
    
    try {
      await appointmentsService.proposeTime(id, proposedTime);
      setProposedTime('');
      await fetchAppointment();
    } catch (error) {
      console.error('Error proposing time:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await appointmentsService.confirm(id);
      await fetchAppointment();
    } catch (error) {
      console.error('Error confirming appointment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    setActionLoading(true);
    try {
      await appointmentsService.cancel(id, cancelReason);
      setShowCancelModal(false);
      await fetchAppointment();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await appointmentsService.complete(id);
      await fetchAppointment();
    } catch (error) {
      console.error('Error completing appointment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setActionLoading(true);
    try {
      await appointmentsService.submitFeedback(id, rating, feedback);
      setShowFeedbackModal(false);
      await fetchAppointment();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading appointment details...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Not Found</h2>
            <p className="text-gray-600 mb-6">The appointment you're looking for doesn't exist or you don't have access.</p>
            <Link to="/appointments" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
              Back to Appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = appointmentsService.getStatusBadge(appointment.status);
  const typeIcon = appointmentsService.getAppointmentTypeIcon(appointment.appointment_type);
  const isProvider = currentUser?.user_type === 'doctor' && appointment.provider === currentUser.id;
  const isPatient = currentUser?.user_type === 'patient';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/appointments" className="flex items-center text-gray-600 hover:text-gray-900">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Appointments
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Appointment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-xl mr-4">
                      <span className="text-3xl">{typeIcon}</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{appointment.title}</h1>
                      <p className="text-gray-500 capitalize">{appointment.appointment_type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                    <span className="mr-1">{statusBadge.icon}</span>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  {/* Patient Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Patient</h3>
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <span className="text-green-600">👤</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                        <p className="text-sm text-gray-500">Patient</p>
                      </div>
                    </div>
                  </div>

                  {/* Provider Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Provider</h3>
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <span className="text-purple-600">👨‍⚕️</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.provider_name}</p>
                        <p className="text-sm text-gray-500">Doctor</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Information */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Schedule</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Requested</p>
                      <p className="font-medium text-gray-900">
                        {new Date(appointment.patient_suggested_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {appointment.provider_proposed_date && (
                      <div>
                        <p className="text-xs text-gray-500">Proposed</p>
                        <p className="font-medium text-blue-600">
                          {new Date(appointment.provider_proposed_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    
                    {appointment.confirmed_date && (
                      <div>
                        <p className="text-xs text-gray-500">Confirmed</p>
                        <p className="font-medium text-green-600">
                          {new Date(appointment.confirmed_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason/Description */}
                {(appointment.reason || appointment.description) && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {appointment.reason ? 'Reason for Visit' : 'Description'}
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-gray-700">{appointment.reason || appointment.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">💬</span>
                  Messages
                </h3>

                <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
                  {appointment.messages?.length > 0 ? (
                    appointment.messages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl p-4 ${
                          msg.sender === currentUser?.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {msg.sender !== currentUser?.id && (
                            <p className="text-xs font-medium mb-1 opacity-75">{msg.sender_name}</p>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={actionLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || actionLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Action Buttons Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">⚡</span>
                  Actions
                </h3>

                <div className="space-y-3">
                  {isProvider && appointment.status === 'requested' && (
                    <div className="space-y-3">
                      <input
                        type="datetime-local"
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={handleProposeTime}
                        disabled={!proposedTime || actionLoading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Proposing...' : 'Propose New Time'}
                      </button>
                    </div>
                  )}

                  {isPatient && appointment.status === 'proposed' && (
                    <button
                      onClick={handleConfirm}
                      disabled={actionLoading}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
                    >
                      {actionLoading ? 'Confirming...' : 'Confirm Appointment'}
                    </button>
                  )}

                  {isProvider && appointment.status === 'confirmed' && (
                    <button
                      onClick={handleComplete}
                      disabled={actionLoading}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
                    >
                      {actionLoading ? 'Completing...' : 'Mark as Complete'}
                    </button>
                  )}

                  {appointment.can_cancel && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      disabled={actionLoading}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700"
                    >
                      Cancel Appointment
                    </button>
                  )}

                  {isPatient && appointment.status === 'completed' && !appointment.feedback && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700"
                    >
                      Leave Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Type</dt>
                    <dd className="font-medium text-gray-900 capitalize">{appointment.appointment_type?.replace('_', ' ')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Duration</dt>
                    <dd className="font-medium text-gray-900">{appointment.estimated_duration} minutes</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Created</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(appointment.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  {appointment.cancellation_reason && (
                    <div className="pt-3 border-t border-gray-200">
                      <dt className="text-gray-600 mb-1">Cancellation Reason</dt>
                      <dd className="text-red-600 text-sm">{appointment.cancellation_reason}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Feedback Card (if exists) */}
            {appointment.feedback && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Feedback</h3>
                  <div className="flex items-center mb-3">
                    {[1,2,3,4,5].map(star => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= appointment.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {appointment.feedback.feedback && (
                    <p className="text-gray-600 text-sm">{appointment.feedback.feedback}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted on {new Date(appointment.feedback.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowCancelModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Appointment</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for cancellation:</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
                placeholder="Enter cancellation reason..."
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason || actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowFeedbackModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Your Experience</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (Optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetail;