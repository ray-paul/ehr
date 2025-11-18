import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="container mt-5">
      <div className="text-center">
        <h1>Welcome to the EHR App</h1>
        <p className="lead">This is a public page to verify routing and that React is mounted correctly.</p>
        <div className="mt-3">
          <Link to="/login" className="btn btn-primary me-2">Login</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
