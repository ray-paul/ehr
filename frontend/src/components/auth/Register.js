// frontend/src/components/auth/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const Register = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    password_confirmation: '',
    email: '', 
    first_name: '',
    last_name: '',
    user_type: 'patient',
    work_id: '',
    license_number: '',
    specialization: '',
    phone: '',
    address: '',
    date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const isStaff = formData.user_type !== 'patient';
  const staffRoles = [
    { value: 'doctor', label: 'Doctor', icon: 'fa-user-md' },
    { value: 'nurse', label: 'Nurse', icon: 'fa-user-nurse' },
    { value: 'pharmacist', label: 'Pharmacist', icon: 'fa-prescription-bottle' },
    { value: 'radiologist', label: 'Radiologist', icon: 'fa-x-ray' },
    { value: 'labscientist', label: 'Lab Scientist', icon: 'fa-microscope' },
    { value: 'admin', label: 'Administrator', icon: 'fa-cog' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    // Clear work_id when switching to patient
    if (name === 'user_type' && value === 'patient') {
      setFormData(prev => ({ ...prev, work_id: '', license_number: '', specialization: '' }));
    }
  };

  const validateStep1 = () => {
    if (!formData.user_type) {
      setError('Please select a role');
      return false;
    }
    if (isStaff && !formData.work_id.trim()) {
      setError('Work ID is required for staff members');
      return false;
    }
    if (!formData.email.trim() || !formData.username.trim()) {
      setError('Email and username are required');
      return false;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API - remove confirmation field
      const submitData = { ...formData };
      delete submitData.password_confirmation;

      let response;
      
      // Use appropriate service method based on user type
      if (isStaff) {
        response = await authService.registerStaff(submitData);
      } else {
        response = await authService.registerPatient(submitData);
      }
      
      // If we have a token, user is logged in automatically
      if (response.token) {
        navigate('/', { 
          state: { 
            message: response.message || `Registration successful! ${isStaff ? 'Your account is pending verification.' : 'Welcome!'}` 
          } 
        });
      } else {
        // If no token (shouldn't happen with current implementation), redirect to login
        navigate('/login', { 
          state: { 
            registered: true,
            message: response.message || 'Registration successful! Please login to continue.' 
          } 
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err?.response?.data) {
        // Handle Django validation errors
        const errorData = err.response.data;
        
        if (typeof errorData === 'object') {
          // Format field errors - handle different error formats
          let errorMessage = '';
          
          if (errorData.non_field_errors) {
            // Non-field errors
            errorMessage = Array.isArray(errorData.non_field_errors) 
              ? errorData.non_field_errors[0] 
              : errorData.non_field_errors;
          } else if (errorData.detail) {
            // Detail field errors
            errorMessage = errorData.detail;
          } else {
            // Field-specific errors
            const fieldErrors = Object.entries(errorData)
              .map(([field, messages]) => {
                const fieldName = field.replace(/_/g, ' ');
                const message = Array.isArray(messages) ? messages[0] : messages;
                return `${fieldName}: ${message}`;
              })
              .join(', ');
            errorMessage = fieldErrors || 'Registration failed. Please check your information.';
          }
          
          setError(errorMessage);
        } else {
          setError(errorData.detail || errorData || 'Registration failed');
        }
      } else if (err?.request) {
        setError('No response from server. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title text-center mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Create Account
              </h3>
              <div className="text-center mt-2">
                <div className="d-flex justify-content-center">
                  <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1</div>
                  <div className="step-line"></div>
                  <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>
                <small className="text-white-50">
                  Step {step} of 2: {step === 1 ? 'Role Selection' : 'Personal Information'}
                </small>
              </div>
            </div>

            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <span>{error}</span>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h5 className="text-center mb-4">Select Your Role</h5>
                  
                  {/* Role Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">I am a:</label>
                    <div className="row g-3">
                      {/* Patient Option */}
                      <div className="col-6">
                        <div 
                          className={`role-card ${formData.user_type === 'patient' ? 'selected' : ''}`}
                          onClick={() => handleChange({ target: { name: 'user_type', value: 'patient' } })}
                        >
                          <i className="fas fa-user fa-2x mb-2 text-primary"></i>
                          <div className="fw-bold">Patient</div>
                          <small className="text-muted">Access your medical records</small>
                        </div>
                      </div>

                      {/* Staff Options */}
                      {staffRoles.map(role => (
                        <div key={role.value} className="col-6">
                          <div 
                            className={`role-card ${formData.user_type === role.value ? 'selected' : ''}`}
                            onClick={() => handleChange({ target: { name: 'user_type', value: role.value } })}
                          >
                            <i className={`fas ${role.icon} fa-2x mb-2 text-success`}></i>
                            <div className="fw-bold">{role.label}</div>
                            <small className="text-muted">Healthcare professional</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="Choose a username"
                      />
                    </div>
                  </div>

                  {/* Staff-specific fields */}
                  {isStaff && (
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Work ID *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="work_id"
                          value={formData.work_id}
                          onChange={handleChange}
                          placeholder="e.g., DOC-12345"
                          required
                        />
                        <div className="form-text">Your official employee/registration ID</div>
                      </div>
                      {formData.user_type === 'doctor' && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label">License Number</label>
                          <input
                            type="text"
                            className="form-control"
                            name="license_number"
                            value={formData.license_number}
                            onChange={handleChange}
                            placeholder="Medical license number"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <Link to="/login" className="btn btn-outline-secondary">
                      <i className="fas fa-arrow-left me-2"></i>
                      Back to Login
                    </Link>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={!formData.email || !formData.username || (isStaff && !formData.work_id)}
                    >
                      Continue
                      <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmit}>
                  <h5 className="text-center mb-4">Personal Information</h5>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {formData.user_type === 'doctor' && (
                    <div className="mb-3">
                      <label className="form-label">Specialization</label>
                      <input
                        type="text"
                        className="form-control"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        placeholder="e.g., Cardiology, Pediatrics"
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main Street, City, State, ZIP Code"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="8"
                        placeholder="At least 8 characters"
                      />
                      <div className="form-text">Minimum 8 characters with letters and numbers</div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Confirm Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                        placeholder="Re-enter your password"
                      />
                    </div>
                  </div>

                  {isStaff && (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Staff Account:</strong> Your account will require verification by an administrator before full access is granted. You will receive limited access until verified.
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={loading || !formData.first_name || !formData.last_name || !formData.password || !formData.password_confirmation}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>
                          Complete Registration
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <small className="text-muted">
                  Already have an account? <Link to="/login" className="text-decoration-none">Sign In</Link>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .role-card {
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 1.5rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .role-card:hover {
          border-color: #0d6efd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .role-card.selected {
          border-color: #0d6efd;
          background-color: #f8f9fa;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2);
        }
        .step-indicator {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #6c757d;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .step-indicator.active {
          background: #fff;
          color: #0d6efd;
          transform: scale(1.1);
        }
        .step-line {
          width: 60px;
          height: 2px;
          background: #6c757d;
          margin: 0 10px;
          align-self: center;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default Register;