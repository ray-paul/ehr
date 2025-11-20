// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import api from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appointmentReminders: true,
    labResults: true,
    emergencyAlerts: false,
    prescriptionUpdates: true
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showMessage('Password must be at least 8 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/accounts/change-password/', passwordData);
      showMessage('Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      showMessage('Error changing password. Please check your current password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (setting, value) => {
    const updatedSettings = { ...notificationSettings, [setting]: value };
    setNotificationSettings(updatedSettings);
    showMessage('Notification settings updated');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' }
  ];

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengths = [
      { label: 'Very Weak', color: 'text-red-500' },
      { label: 'Weak', color: 'text-orange-500' },
      { label: 'Fair', color: 'text-yellow-500' },
      { label: 'Good', color: 'text-blue-500' },
      { label: 'Strong', color: 'text-green-500' }
    ];
    
    return { ...strengths[strength], strength };
  };

  const passwordStrength = getPasswordStrength(passwordData.new_password);

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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Account Settings
          </h2>
          <p className="text-gray-600 text-lg">
            Manage your account preferences and security
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="text-xl mr-3">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* User Info Card */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600 text-sm font-medium">
                      {user?.user_type?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {user?.first_name || 'User'} {user?.last_name || ''}
                    </p>
                    <p className="text-gray-500 text-xs capitalize">
                      {user?.user_type || 'User'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 rounded-full ${
                      user?.is_verified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user?.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
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

            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">👤</span>
                  <h3 className="text-2xl font-bold text-gray-900">Account Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user?.first_name || 'Not'} {user?.last_name || 'Set'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user?.email || 'Not set'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900">{user?.username || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                          <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-900 capitalize">{user?.user_type || 'Not set'}</p>
                          </div>
                        </div>
                        {user?.work_id && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Work ID</label>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-gray-900">{user.work_id}</p>
                            </div>
                          </div>
                        )}
                        {user?.specialization && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-gray-900">{user.specialization}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                      Edit Profile Information
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">🔒</span>
                  <h3 className="text-2xl font-bold text-gray-900">Security Settings</h3>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="current_password"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                          placeholder="Enter current password"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="new_password"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                          placeholder="Enter new password"
                          disabled={loading}
                        />
                        {passwordData.new_password && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Password strength</span>
                              <span className={`text-sm font-medium ${passwordStrength.color}`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength.strength === 0 ? 'bg-red-500 w-1/4' :
                                  passwordStrength.strength === 1 ? 'bg-orange-500 w-2/4' :
                                  passwordStrength.strength === 2 ? 'bg-yellow-500 w-3/4' :
                                  passwordStrength.strength >= 3 ? 'bg-green-500 w-full' : ''
                                }`}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400"
                          placeholder="Confirm new password"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating Password...
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">🔔</span>
                  <h3 className="text-2xl font-bold text-gray-900">Notification Settings</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h4>
                    <div className="space-y-4">
                      {Object.entries(notificationSettings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {key === 'emailNotifications' && 'Receive general email notifications'}
                              {key === 'appointmentReminders' && 'Get reminded about upcoming appointments'}
                              {key === 'labResults' && 'Notify when lab results are available'}
                              {key === 'emergencyAlerts' && 'Receive emergency patient alerts'}
                              {key === 'prescriptionUpdates' && 'Updates about prescription status'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationChange(key, !value)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              value ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">🛡️</span>
                  <h3 className="text-2xl font-bold text-gray-900">Privacy & Data</h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Data Export</h4>
                    <p className="text-blue-700 mb-4">
                      Download a copy of all your personal data stored in the system.
                    </p>
                    <button className="bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 border border-blue-200 transition-colors duration-200">
                      Export My Data
                    </button>
                  </div>

                  <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="text-lg font-semibold text-red-900 mb-2">Account Deletion</h4>
                    <p className="text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button className="bg-white text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-50 border border-red-200 transition-colors duration-200">
                      Request Account Deletion
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;