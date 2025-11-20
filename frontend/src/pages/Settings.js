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
    prescriptionUpdates: true,
    systemUpdates: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareData: false,
    showOnlineStatus: true,
    allowMessages: true
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
    
    // Simulate API call to save settings
    setTimeout(() => {
      showMessage('Notification settings updated');
    }, 300);
  };

  const handlePrivacyChange = (setting, value) => {
    const updatedSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(updatedSettings);
    
    // Simulate API call to save settings
    setTimeout(() => {
      showMessage('Privacy settings updated');
    }, 300);
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      showMessage('Your data export has been prepared. You will receive an email with download instructions.');
    } catch (error) {
      showMessage('Error preparing data export', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = () => {
    if (window.confirm('Are you sure you want to request account deletion? This action cannot be undone and all your data will be permanently deleted.')) {
      showMessage('Account deletion request submitted. Our team will contact you shortly.', 'warning');
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: 'fa-user-cog', color: 'primary' },
    { id: 'security', label: 'Security', icon: 'fa-shield-alt', color: 'success' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell', color: 'warning' },
    { id: 'privacy', label: 'Privacy', icon: 'fa-lock', color: 'info' },
    { id: 'preferences', label: 'Preferences', icon: 'fa-sliders-h', color: 'secondary' }
  ];

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengths = [
      { label: 'Very Weak', color: 'danger' },
      { label: 'Weak', color: 'warning' },
      { label: 'Fair', color: 'info' },
      { label: 'Good', color: 'primary' },
      { label: 'Strong', color: 'success' }
    ];
    
    return { ...strengths[strength], strength };
  };

  const passwordStrength = getPasswordStrength(passwordData.new_password);

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="card-title mb-0">
                <i className="fas fa-cog me-2 text-primary"></i>
                Settings
              </h5>
            </div>
            <div className="card-body p-0">
              <nav className="nav flex-column">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`nav-link text-start px-4 py-3 border-0 rounded-0 ${
                      activeTab === tab.id 
                        ? `bg-${tab.color} text-white` 
                        : 'text-dark hover-bg-light'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`fas ${tab.icon} me-3`}></i>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h6 className="card-title">
                <i className="fas fa-chart-bar me-2 text-info"></i>
                Account Overview
              </h6>
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Account Status</small>
                  <span className={`badge bg-${user?.is_verified ? 'success' : 'warning'}`}>
                    {user?.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Member Since</small>
                  <small className="text-muted">
                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">User Role</small>
                  <small className="text-capitalize text-primary">{user?.user_type || 'User'}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {/* Message Alert */}
          {message.text && (
            <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type} alert-dismissible fade show`}>
              <i className={`fas ${
                message.type === 'error' ? 'fa-exclamation-triangle' :
                message.type === 'warning' ? 'fa-exclamation-circle' : 'fa-check-circle'
              } me-2`}></i>
              {message.text}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setMessage({ text: '', type: '' })}
              ></button>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-cog me-2 text-primary"></i>
                  Account Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="setting-group">
                      <h6 className="setting-title">
                        <i className="fas fa-id-card me-2 text-info"></i>
                        Basic Information
                      </h6>
                      <p className="text-muted mb-3">Your basic account details and preferences</p>
                      
                      <div className="info-item">
                        <label className="form-label">Full Name</label>
                        <p className="info-value">{user?.first_name || 'Not'} {user?.last_name || 'Set'}</p>
                      </div>
                      
                      <div className="info-item">
                        <label className="form-label">Email Address</label>
                        <p className="info-value">{user?.email || 'Not set'}</p>
                      </div>
                      
                      <div className="info-item">
                        <label className="form-label">Username</label>
                        <p className="info-value">{user?.username || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="setting-group">
                      <h6 className="setting-title">
                        <i className="fas fa-briefcase me-2 text-success"></i>
                        Professional Information
                      </h6>
                      <p className="text-muted mb-3">Your professional details and role</p>
                      
                      <div className="info-item">
                        <label className="form-label">User Role</label>
                        <p className="info-value text-capitalize">{user?.user_type || 'Not set'}</p>
                      </div>
                      
                      {user?.work_id && (
                        <div className="info-item">
                          <label className="form-label">Work ID</label>
                          <p className="info-value">{user.work_id}</p>
                        </div>
                      )}
                      
                      {user?.specialization && (
                        <div className="info-item">
                          <label className="form-label">Specialization</label>
                          <p className="info-value">{user.specialization}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <button className="btn btn-outline-primary w-100">
                        <i className="fas fa-edit me-2"></i>
                        Edit Profile Information
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-shield-alt me-2 text-success"></i>
                  Security Settings
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="setting-group">
                    <h6 className="setting-title">
                      <i className="fas fa-key me-2 text-warning"></i>
                      Change Password
                    </h6>
                    <p className="text-muted mb-4">Update your password to keep your account secure</p>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Current Password</label>
                        <input
                          type="password"
                          className="form-control"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          required
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          required
                          placeholder="Enter new password"
                        />
                        {passwordData.new_password && (
                          <div className="mt-2">
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className={`progress-bar bg-${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                              ></div>
                            </div>
                            <small className={`text-${passwordStrength.color}`}>
                              Password strength: {passwordStrength.label}
                            </small>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          required
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="setting-group mt-5 pt-4 border-top">
                  <h6 className="setting-title">
                    <i className="fas fa-laptop me-2 text-info"></i>
                    Session Management
                  </h6>
                  <p className="text-muted mb-3">Manage your active sessions across devices</p>
                  
                  <button className="btn btn-outline-danger">
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout All Other Sessions
                  </button>
                  <p className="text-muted mt-2 small">
                    This will log you out from all other devices except this one.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-bell me-2 text-warning"></i>
                  Notification Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="setting-group">
                  <h6 className="setting-title">
                    <i className="fas fa-envelope me-2 text-primary"></i>
                    Email Notifications
                  </h6>
                  <p className="text-muted mb-3">Control how we notify you via email</p>
                  
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="form-check form-switch mb-3 p-3 bg-light rounded">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => handleNotificationChange(key, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={key}>
                        <strong>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {key === 'emailNotifications' && 'Receive general email notifications'}
                          {key === 'appointmentReminders' && 'Get reminded about upcoming appointments'}
                          {key === 'labResults' && 'Notify when lab results are available'}
                          {key === 'emergencyAlerts' && 'Receive emergency patient alerts (doctors only)'}
                          {key === 'prescriptionUpdates' && 'Updates about prescription status'}
                          {key === 'systemUpdates' && 'Important system maintenance notifications'}
                        </small>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-lock me-2 text-info"></i>
                  Privacy Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="setting-group">
                  <h6 className="setting-title">
                    <i className="fas fa-shield-alt me-2 text-success"></i>
                    Data Privacy
                  </h6>
                  <p className="text-muted mb-3">Control how your data is used and shared</p>
                  
                  {Object.entries(privacySettings).map(([key, value]) => (
                    <div key={key} className="form-check form-switch mb-3 p-3 bg-light rounded">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`privacy-${key}`}
                        checked={value}
                        onChange={(e) => handlePrivacyChange(key, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`privacy-${key}`}>
                        <strong>
                          {key === 'shareData' && 'Share Anonymous Data for Research'}
                          {key === 'showOnlineStatus' && 'Show Online Status'}
                          {key === 'allowMessages' && 'Allow Direct Messages'}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {key === 'shareData' && 'Your personal information will never be shared. Only anonymized medical data may be used for research purposes.'}
                          {key === 'showOnlineStatus' && 'Allow other users to see when you are active in the system'}
                          {key === 'allowMessages' && 'Allow patients and colleagues to send you direct messages'}
                        </small>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="setting-group mt-5 pt-4 border-top">
                  <h6 className="setting-title">
                    <i className="fas fa-download me-2 text-primary"></i>
                    Data Management
                  </h6>
                  <p className="text-muted mb-3">Manage your personal data</p>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <button 
                        className="btn btn-outline-primary w-100"
                        onClick={handleDataExport}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Preparing Export...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download me-2"></i>
                            Export My Data
                          </>
                        )}
                      </button>
                      <p className="text-muted mt-2 small">
                        Download a copy of all your personal data stored in the system.
                      </p>
                    </div>
                    
                    <div className="col-md-6">
                      <button 
                        className="btn btn-outline-danger w-100"
                        onClick={handleAccountDeletion}
                      >
                        <i className="fas fa-trash me-2"></i>
                        Request Account Deletion
                      </button>
                      <p className="text-muted mt-2 small">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-sliders-h me-2 text-secondary"></i>
                  Preferences
                </h5>
              </div>
              <div className="card-body">
                <div className="setting-group">
                  <h6 className="setting-title">
                    <i className="fas fa-palette me-2 text-primary"></i>
                    Display Preferences
                  </h6>
                  <p className="text-muted mb-3">Customize your interface experience</p>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Theme</label>
                      <select className="form-select">
                        <option>Light Theme</option>
                        <option>Dark Theme</option>
                        <option>Auto (System Preference)</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Language</label>
                      <select className="form-select">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Time Zone</label>
                      <select className="form-select">
                        <option>UTC-05:00 Eastern Time</option>
                        <option>UTC-06:00 Central Time</option>
                        <option>UTC-07:00 Mountain Time</option>
                        <option>UTC-08:00 Pacific Time</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date Format</label>
                      <select className="form-select">
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                  
                  <button className="btn btn-primary">
                    <i className="fas fa-save me-2"></i>
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
        .setting-group {
          margin-bottom: 2rem;
        }
        .setting-title {
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .info-item {
          margin-bottom: 1.5rem;
        }
        .info-value {
          font-weight: 500;
          color: #495057;
          margin-bottom: 0;
        }
        .form-check-input:checked {
          background-color: #198754;
          border-color: #198754;
        }
        .nav-link {
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
        }
        .nav-link.active {
          border-left-color: #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default Settings;