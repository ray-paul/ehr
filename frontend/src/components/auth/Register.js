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
    { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', color: 'blue', description: 'Full patient access, prescribe medications' },
    { value: 'nurse', label: 'Nurse', icon: '👩‍⚕️', color: 'green', description: 'Patient care, vitals, assist procedures' },
    { value: 'pharmacist', label: 'Pharmacist', icon: '💊', color: 'orange', description: 'Manage prescriptions, medication dispensing' },
    { value: 'radiologist', label: 'Radiologist', icon: '📷', color: 'purple', description: 'Upload/download radiology images' },
    { value: 'labscientist', label: 'Lab Scientist', icon: '🔬', color: 'yellow', description: 'Upload lab results, manage tests' },
    { value: 'admin', label: 'Administrator', icon: '⚙️', color: 'red', description: 'System configuration, user management' }
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
      setError('Please select your role');
      return false;
    }
    if (isStaff && !formData.work_id.trim()) {
      setError('Work ID is required for healthcare professionals');
      return false;
    }
    if (!formData.email.trim() || !formData.username.trim()) {
      setError('Email and username are required');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.username && formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
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
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
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
      const submitData = { ...formData };
     
      let response;
      if (isStaff) {
        response = await authService.registerStaff(submitData);
      } else {
        response = await authService.registerPatient(submitData);
      }
      
      if (response.token) {
        navigate('/', { 
          state: { 
            message: response.message || `Registration successful! ${isStaff ? 'Your account is pending verification.' : 'Welcome to EHR System!'}` 
          } 
        });
      } else {
        navigate('/login', { 
          state: { 
            registered: true,
            message: 'Registration successful! Please login to continue.' 
          } 
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          let errorMessage = '';
          if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors) 
              ? errorData.non_field_errors[0] 
              : errorData.non_field_errors;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else {
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
        setError('No response from server. Please check your internet connection.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengths = [
      { label: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500', width: 'w-1/4' },
      { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500', width: 'w-2/4' },
      { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500', width: 'w-3/4' },
      { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500', width: 'w-full' },
      { label: 'Strong', color: 'text-green-500', bg: 'bg-green-500', width: 'w-full' }
    ];
    
    return { ...strengths[strength], strength };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-white"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600 text-lg">
            Join our secure healthcare platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`w-24 h-1 mx-2 ${
                  step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 2 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-sm text-gray-500 mr-12">Role & Account</span>
              <span className="text-sm text-gray-500 ml-12">Personal Details</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  I am registering as a:
                </label>
                
                {/* Patient Card */}
                <div 
                  className={`mb-6 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    formData.user_type === 'patient'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleChange({ target: { name: 'user_type', value: 'patient' } })}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Patient</h3>
                        {formData.user_type === 'patient' && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Selected</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">Access your medical records, request appointments, view test results</p>
                    </div>
                  </div>
                </div>

                {/* Staff Roles Grid */}
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Healthcare Professionals:
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {staffRoles.map(role => (
                    <div
                      key={role.value}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        formData.user_type === role.value
                          ? `border-${role.color}-500 bg-${role.color}-50`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleChange({ target: { name: 'user_type', value: role.value } })}
                    >
                      <div className="flex items-center">
                        <div className={`bg-${role.color}-100 p-3 rounded-full mr-3`}>
                          <span className="text-xl">{role.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{role.label}</h4>
                            {formData.user_type === role.value && (
                              <span className={`text-${role.color}-600 text-sm`}>✓</span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-1">{role.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>

                {isStaff && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="work_id"
                      value={formData.work_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., DOC-12345"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Your official employee or license ID</p>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Link
                  to="/login"
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Back to Login
                </Link>
                <button
                  onClick={handleNext}
                  disabled={!formData.user_type || !formData.email || !formData.username || (isStaff && !formData.work_id)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Personal Details →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {formData.user_type === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="123 Main Street, City, State, ZIP Code"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Enter password"
                      required
                    />
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">Password strength:</span>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${passwordStrength.bg} ${passwordStrength.width}`}></div>
                        </div>
                        <ul className="mt-2 space-y-1">
                          <li className={`text-xs flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                            <span className="mr-1">{formData.password.length >= 8 ? '✓' : '○'}</span> At least 8 characters
                          </li>
                          <li className={`text-xs flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                            <span className="mr-1">{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span> One uppercase letter
                          </li>
                          <li className={`text-xs flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                            <span className="mr-1">{/[0-9]/.test(formData.password) ? '✓' : '○'}</span> One number
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Re-enter password"
                      required
                    />
                    {formData.password_confirmation && formData.password !== formData.password_confirmation && (
                      <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Staff Verification Notice */}
              {isStaff && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <span className="text-blue-600">ℹ️</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Verification Required</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your account will require verification by an administrator before full access is granted. 
                        You'll receive limited access until verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms Agreement */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 mr-3"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                    . I understand that my information will be handled according to HIPAA guidelines.
                  </label>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Secure EHR System • HIPAA Compliant • 256-bit Encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;