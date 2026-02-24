// frontend/src/pages/Appointments.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentsService } from '../services/appointments';
import { authService } from '../services/auth';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Role-based access control
  const isPatient = currentUser?.user_type === 'patient';
  const isDoctor = currentUser?.user_type === 'doctor';
  const isAdmin = ['admin', 'master_admin'].includes(currentUser?.user_type);
  const isStaff = currentUser?.user_type && ['doctor', 'nurse', 'admin', 'pharmacist', 'radiologist', 'labscientist', 'master_admin'].includes(currentUser.user_type);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      
      // Use role-specific API calls
      if (isPatient && currentUser?.patient_id) {
        data = await appointmentsService.getPatientAppointments(currentUser.patient_id);
      } else if (isDoctor && currentUser?.id) {
        data = await appointmentsService.getProviderAppointments(currentUser.id);
      } else {
        data = await appointmentsService.list();
      }
      
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.detail || 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action, ...params) => {
    setActionInProgress(appointmentId);
    setError('');
    setSuccess('');

    try {
      let result;
      switch (action) {
        case 'confirm':
          result = await appointmentsService.confirm(appointmentId, ...params);
          setSuccess('Appointment confirmed successfully!');
          break;
        case 'cancel':
          if (window.confirm('Are you sure you want to cancel this appointment?')) {
            result = await appointmentsService.cancel(appointmentId, ...params);
            setSuccess('Appointment cancelled successfully!');
          } else {
            setActionInProgress(null);
            return;
          }
          break;
        case 'complete':
          result = await appointmentsService.complete(appointmentId);
          setSuccess('Appointment marked as completed!');
          break;
        case 'reschedule':
          result = await appointmentsService.reschedule(appointmentId, ...params);
          setSuccess('Appointment rescheduled successfully!');
          break;
        default:
          break;
      }
      
      // Refresh appointments after action
      await fetchAppointments();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(`Error ${action} appointment:`, err);
      setError(err.response?.data?.error || `Failed to ${action} appointment. Please try again.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { color: 'bg-yellow-100 text-yellow-800', label: 'Requested', icon: '⏳' },
      proposed: { color: 'bg-blue-100 text-blue-800', label: 'Counter Proposed', icon: '🔄' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed', icon: '✅' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: '❌' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: '✓' },
      no_show: { color: 'bg-orange-100 text-orange-800', label: 'No Show', icon: '⚠️' },
      rescheduled: { color: 'bg-purple-100 text-purple-800', label: 'Rescheduled', icon: '↻' }
    };
    
    const config = statusConfig[status] || statusConfig.requested;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getAppointmentTypeIcon = (type) => {
    const icons = {
      checkup: '🏥',
      followup: '🔄',
      emergency: '🚨',
      consultation: '👨‍⚕️',
      procedure: '🔧',
      vaccination: '💉',
      lab_test: '🔬',
      imaging: '📷'
    };
    return icons[type] || '📅';
  };

  const filteredAppointments = appointments.filter(appt => {
    if (filter === 'all') return true;
    return appt.status === filter;
  });

  const getTimeDisplay = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActionButtons = (appointment) => {
    const isProcessing = actionInProgress === appointment.id;
    
    if (isPatient) {
      return (
        <>
          <Link
            to={`/appointments/${appointment.id}`}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-center flex items-center justify-center"
          >
            <span className="mr-2">👁️</span>
            View Details
          </Link>
          {appointment.status === 'proposed' && (
            <button 
              onClick={() => handleAction(appointment.id, 'confirm')}
              disabled={isProcessing}
              className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirming...
                </span>
              ) : (
                <>
                  <span className="mr-2">✅</span>
                  Confirm
                </>
              )}
            </button>
          )}
          {['requested', 'proposed', 'confirmed'].includes(appointment.status) && (
            <button 
              onClick={() => handleAction(appointment.id, 'cancel', 'Patient requested cancellation')}
              disabled={isProcessing}
              className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </span>
              ) : (
                <>
                  <span className="mr-2">❌</span>
                  Cancel
                </>
              )}
            </button>
          )}
        </>
      );
    }

    if (isStaff) {
      return (
        <>
          <Link
            to={`/appointments/${appointment.id}`}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-center flex items-center justify-center"
          >
            <span className="mr-2">👁️</span>
            View Details
          </Link>
          {appointment.status === 'requested' && (
            <button 
              onClick={() => navigate(`/appointments/${appointment.id}`)}
              disabled={isProcessing}
              className="bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center"
            >
              <span className="mr-2">🔄</span>
              Propose Time
            </button>
          )}
          {appointment.status === 'confirmed' && (
            <button 
              onClick={() => handleAction(appointment.id, 'complete')}
              disabled={isProcessing}
              className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Completing...
                </span>
              ) : (
                <>
                  <span className="mr-2">✓</span>
                  Complete
                </>
              )}
            </button>
          )}
          {['requested', 'proposed', 'confirmed'].includes(appointment.status) && (
            <button 
              onClick={() => handleAction(appointment.id, 'cancel', 'Staff cancelled appointment')}
              disabled={isProcessing}
              className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </span>
              ) : (
                <>
                  <span className="mr-2">❌</span>
                  Cancel
                </>
              )}
            </button>
          )}
        </>
      );
    }

    return (
      <Link
        to={`/appointments/${appointment.id}`}
        className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-center flex items-center justify-center"
      >
        <span className="mr-2">👁️</span>
        View Details
      </Link>
    );
  };

  const filterOptions = [
    { value: 'all', label: 'All Appointments', emoji: '📋', count: appointments.length },
    { value: 'requested', label: 'Requested', emoji: '⏳', count: appointments.filter(a => a.status === 'requested').length },
    { value: 'proposed', label: 'Counter Proposed', emoji: '🔄', count: appointments.filter(a => a.status === 'proposed').length },
    { value: 'confirmed', label: 'Confirmed', emoji: '✅', count: appointments.filter(a => a.status === 'confirmed').length },
    { value: 'cancelled', label: 'Cancelled', emoji: '❌', count: appointments.filter(a => a.status === 'cancelled').length },
    { value: 'completed', label: 'Completed', emoji: '✓', count: appointments.filter(a => a.status === 'completed').length },
    { value: 'no_show', label: 'No Show', emoji: '⚠️', count: appointments.filter(a => a.status === 'no_show').length },
    { value: 'rescheduled', label: 'Rescheduled', emoji: '↻', count: appointments.filter(a => a.status === 'rescheduled').length }
  ];

  const currentFilter = filterOptions.find(option => option.value === filter) || filterOptions[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading appointments...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-white"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Appointments
          </h2>
          <p className="text-gray-600 text-lg">
            {isPatient ? 'Your healthcare appointments' : 'Manage patient appointments and schedules'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar with Stats */}
          <div className="lg:col-span-1">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">⚡</span>
                Quick Actions
              </h3>
              <Link 
                to="/appointments/new"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center mb-3"
              >
                <span className="text-xl mr-2">+</span>
                {isPatient ? 'Request Appointment' : 'New Appointment'}
              </Link>
              <button 
                onClick={fetchAppointments}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
              >
                <span className="text-xl mr-2">🔄</span>
                Refresh
              </button>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-700 font-medium">Confirmed</span>
                  <span className="text-green-700 font-bold">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-700 font-medium">Pending</span>
                  <span className="text-blue-700 font-bold">
                    {appointments.filter(a => ['requested', 'proposed'].includes(a.status)).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-yellow-700 font-medium">Today</span>
                  <span className="text-yellow-700 font-bold">
                    {appointments.filter(a => {
                      const today = new Date().toDateString();
                      return a.confirmed_date && new Date(a.confirmed_date).toDateString() === today;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-medium">Total</span>
                  <span className="text-gray-700 font-bold">{appointments.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header Bar with Filter Dropdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="text-2xl mr-3">📅</span>
                    {isPatient ? 'Your Appointments' : 'Appointment Management'}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {/* Filter Dropdown */}
                <div className="mt-4 sm:mt-0 relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center"
                  >
                    <span className="mr-2">{currentFilter.emoji}</span>
                    {currentFilter.label}
                    <span className="ml-2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Filter by Status
                        </div>
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFilter(option.value);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors duration-200 ${
                              filter === option.value
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-lg mr-3">{option.emoji}</span>
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              filter === option.value
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {option.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
                <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Appointments Found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' 
                    ? `You don't have any ${isPatient ? '' : 'assigned '}appointments scheduled yet.`
                    : `No appointments with status "${currentFilter.label}" found.`
                  }
                </p>
                <Link 
                  to="/appointments/new"
                  className="inline-flex items-center bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  <span className="text-xl mr-2">+</span>
                  {isPatient ? 'Request Your First Appointment' : 'Create New Appointment'}
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                        {/* Left Section - Appointment Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                <span className="text-xl">{getAppointmentTypeIcon(appointment.appointment_type)}</span>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {appointment.title || 'Untitled Appointment'}
                                </h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  {getStatusBadge(appointment.status)}
                                  {appointment.appointment_type && (
                                    <span className="text-sm text-gray-500 capitalize">
                                      {appointment.appointment_type.replace('_', ' ')}
                                    </span>
                                  )}
                                  <span className="text-sm text-gray-500">
                                    Est. {appointment.estimated_duration || 30} min
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6 mt-4">
                            {/* Patient & Provider Info */}
                            <div className="space-y-3">
                              {!isPatient && (
                                <div className="flex items-center">
                                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                                    <span className="text-green-600">👤</span>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Patient</p>
                                    <p className="font-medium text-gray-900">{appointment.patient_name || 'Unknown Patient'}</p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center">
                                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                  <span className="text-purple-600">👨‍⚕️</span>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Provider</p>
                                  <p className="font-medium text-gray-900">{appointment.provider_name || 'Unknown Provider'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Timing Information */}
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                  <span className="text-orange-600">⏰</span>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Requested Time</p>
                                  <p className="font-medium text-gray-900">
                                    {getTimeDisplay(appointment.patient_suggested_date)}
                                  </p>
                                </div>
                              </div>
                              {appointment.provider_proposed_date && (
                                <div className="flex items-center">
                                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <span className="text-blue-600">🔄</span>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Proposed Time</p>
                                    <p className="font-medium text-gray-900">
                                      {getTimeDisplay(appointment.provider_proposed_date)}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {appointment.confirmed_date && (
                                <div className="flex items-center">
                                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                                    <span className="text-green-600">✅</span>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Confirmed Time</p>
                                    <p className="font-medium text-green-600">
                                      {getTimeDisplay(appointment.confirmed_date)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {appointment.reason && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-800 mb-1">Reason for visit:</p>
                              <p className="text-sm text-gray-700">{appointment.reason}</p>
                            </div>
                          )}
                          
                          {appointment.description && !appointment.reason && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-600">{appointment.description}</p>
                            </div>
                          )}
                          
                          {appointment.cancellation_reason && (
                            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-sm font-medium text-red-800 mb-1">Cancellation reason:</p>
                              <p className="text-sm text-gray-700">{appointment.cancellation_reason}</p>
                            </div>
                          )}
                        </div>

                        {/* Right Section - Actions */}
                        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-3 min-w-[160px]">
                          {getActionButtons(appointment)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showFilterDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
};

export default Appointments;