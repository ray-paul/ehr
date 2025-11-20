// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id) {
        // For now, use the current user data from localStorage
        // In a real app, you'd fetch from an API endpoint
        setUser(currentUser);
        setFormData({
          first_name: currentUser.first_name || '',
          last_name: currentUser.last_name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: currentUser.address || '',
          specialization: currentUser.specialization || ''
        });
      } else {
        showMessage('No user logged in', 'error');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('Error loading profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulate API call - in real app, you'd call your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local user data
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      showMessage('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      showMessage('Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRolePermissions = (userType) => {
    const permissions = {
      doctor: [
        'Access all patient data',
        'Write e-prescriptions',
        'Create medical reports',
        'Download lab results',
        'Download radiology images',
        'Schedule appointments'
      ],
      pharmacist: [
        'Access e-prescriptions',
        'Manage medication inventory',
        'Process prescription refills',
        'View prescription history'
      ],
      radiologist: [
        'Upload radiology images',
        'Download radiology images',
        'Create radiology reports',
        'View patient imaging history'
      ],
      labscientist: [
        'Upload lab results',
        'Manage lab tests',
        'View test orders',
        'Update test status'
      ],
      nurse: [
        'View patient records',
        'Update patient vitals',
        'Schedule appointments',
        'Assist with procedures'
      ],
      admin: [
        'Manage user accounts',
        'System configuration',
        'View all data',
        'Generate reports'
      ],
      patient: [
        'View own medical records',
        'Request appointments',
        'Message healthcare providers',
        'View test results'
      ]
    };
    
    return permissions[userType] || ['Basic user access'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading profile...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center py-12">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No User Data</h3>
              <p className="text-gray-600 mb-6">Unable to load profile information.</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const permissions = getRolePermissions(user.user_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            My Profile
          </h2>
          <p className="text-gray-600 text-lg">
            Manage your personal and professional information
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* Profile Avatar */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {user.first_name?.charAt(0) || 'U'}{user.last_name?.charAt(0) || ''}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {user.first_name || 'No'} {user.last_name || 'Name'}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{user.email || 'No email'}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Member Since</span>
                  <span className="text-gray-900 text-sm font-medium">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">User Role</span>
                  <span className="text-gray-900 text-sm font-medium capitalize">{user.user_type || 'User'}</span>
                </div>
                {user.work_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Work ID</span>
                    <span className="text-gray-900 text-sm font-medium">{user.work_id}</span>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <button 
                onClick={() => setEditing(!editing)}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {editing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </div>

            {/* Role Badge */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">🎯</span>
                Role Information
              </h4>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {user.user_type === 'doctor' && '👨‍⚕️'}
                    {user.user_type === 'nurse' && '👩‍⚕️'}
                    {user.user_type === 'pharmacist' && '💊'}
                    {user.user_type === 'radiologist' && '📷'}
                    {user.user_type === 'labscientist' && '🔬'}
                    {user.user_type === 'admin' && '⚙️'}
                    {user.user_type === 'patient' && '👤'}
                  </div>
                  <h5 className="font-bold text-gray-900 text-lg capitalize">{user.user_type}</h5>
                  {user.specialization && (
                    <p className="text-blue-600 text-sm mt-1">{user.specialization}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Message Alert */}
            {message.text && (
              <div className={`mb-6 rounded-xl p-4 border ${
                message.type === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}>
                <div className="flex items-center">
                  <svg className={`w-5 h-5 mr-2 ${
                    message.type === 'error' ? 'text-red-500' : 'text-green-500'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    {message.type === 'error' ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    )}
                  </svg>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {!editing ? (
              /* View Mode */
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">📋</span>
                  <h3 className="text-2xl font-bold text-gray-900">Profile Information</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">👤</span>
                        Personal Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user.first_name || 'Not set'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user.last_name || 'Not set'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user.email || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">📞</span>
                        Contact Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user.phone || 'Not set'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user.address || 'Not set'}</p>
                          </div>
                        </div>
                        {user.specialization && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-gray-900">{user.specialization}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">✏️</span>
                  <h3 className="text-2xl font-bold text-gray-900">Edit Profile</h3>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h4>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              id="first_name"
                              name="first_name"
                              value={formData.first_name || ''}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              id="last_name"
                              name="last_name"
                              value={formData.last_name || ''}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                              placeholder="Enter your last name"
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email || ''}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone || ''}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                              placeholder="Enter your phone number"
                            />
                          </div>
                          <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                              Address
                            </label>
                            <textarea
                              id="address"
                              name="address"
                              rows="3"
                              value={formData.address || ''}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                              placeholder="Enter your address"
                            />
                          </div>
                          {user.user_type === 'doctor' && (
                            <div>
                              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                                Specialization
                              </label>
                              <input
                                type="text"
                                id="specialization"
                                name="specialization"
                                value={formData.specialization || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                                placeholder="e.g., Cardiology, Pediatrics"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button 
                      type="submit" 
                      className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Changes...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Permissions Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mt-8">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">🔐</span>
                <h3 className="text-2xl font-bold text-gray-900">Role Permissions</h3>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">✅</span>
                  Your Access Permissions
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {permissions.map((permission, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100">
                      <div className="bg-green-100 p-1 rounded">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <span className="text-green-800 text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;