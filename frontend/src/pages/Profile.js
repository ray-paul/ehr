// frontend/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id) {
        const response = await api.get(`/accounts/user/${currentUser.id}/`);
        setUser(response.data);
        setFormData(response.data);
      } else {
        setMessage('No user logged in');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.put(`/accounts/user/${user.id}/`, formData);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchUserProfile(); // Refresh data
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>No User Data</h4>
          <p>Unable to load profile information. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">My Profile</h4>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="card-body">
              {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                  {message}
                </div>
              )}

              {!editing ? (
                // View Mode
                <div className="row">
                  <div className="col-md-4 text-center mb-4">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{width: '120px', height: '120px'}}>
                      <i className="fas fa-user fa-3x text-secondary"></i>
                    </div>
                    <h5 className="mt-3">{user.first_name || 'No'} {user.last_name || 'Name'}</h5>
                    <span className={`badge bg-${user.is_verified ? 'success' : 'warning'}`}>
                      {user.is_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-6 mb-3">
                        <strong>Username:</strong>
                        <p>{user.username || 'Not set'}</p>
                      </div>
                      <div className="col-6 mb-3">
                        <strong>Email:</strong>
                        <p>{user.email || 'Not set'}</p>
                      </div>
                      <div className="col-6 mb-3">
                        <strong>Role:</strong>
                        <p className="text-capitalize">{user.user_type || 'Not set'}</p>
                      </div>
                      {user.work_id && (
                        <div className="col-6 mb-3">
                          <strong>Work ID:</strong>
                          <p>{user.work_id}</p>
                        </div>
                      )}
                      {user.phone && (
                        <div className="col-6 mb-3">
                          <strong>Phone:</strong>
                          <p>{user.phone}</p>
                        </div>
                      )}
                      {user.specialization && (
                        <div className="col-6 mb-3">
                          <strong>Specialization:</strong>
                          <p>{user.specialization}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        name="address"
                        rows="3"
                        value={formData.address || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Role-specific information */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Role Information</h5>
            </div>
            <div className="card-body">
              <h6>Your current role: <span className="text-capitalize text-primary">{user.user_type || 'Not set'}</span></h6>
              <div className="mt-3">
                <h6>Account Status:</h6>
                <p>
                  <strong>Verification:</strong> 
                  <span className={`badge ${user.is_verified ? 'bg-success' : 'bg-warning'} ms-2`}>
                    {user.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </p>
                {!user.is_verified && user.user_type !== 'patient' && (
                  <div className="alert alert-info">
                    <small>
                      Your staff account is pending verification. Some features may be limited until an administrator verifies your credentials.
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;