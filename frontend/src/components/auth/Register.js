import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.register(formData);
      // If backend returned a user and token, authService stored them and we can go to the app.
      if (authService.getCurrentUser()) {
        navigate('/');
      } else {
        // Otherwise, send the user to login to complete authentication.
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      // Log full error for debugging
      // eslint-disable-next-line no-console
      console.error('Registration error:', err);

      // If server responded with JSON, show that to the user
      if (err?.response) {
        const msg = err.response.data?.detail || err.response.data || err.message;
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } else if (err?.request) {
        // Request was made but no response received
        setError('No response from server. Check that the API is running and reachable, and that CORS is configured.');
      } else {
        // Something else happened setting up the request
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center">Register</h3>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control form-narrow form-narrow-left"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control form-narrow form-narrow-left"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control form-narrow form-narrow-left"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="text-start mt-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </form>

              <div className="text-center mt-3">
                <Link to="/login">Already have an account? Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
