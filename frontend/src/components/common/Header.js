// frontend/src/components/common/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const Header = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">EHR System</Link>
        
        <div className="navbar-nav ms-auto">
          <span className="navbar-text me-3">
            Welcome, {currentUser?.first_name || currentUser?.username}
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;