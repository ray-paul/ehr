import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body text-center">
              <h1 className="display-6">403 — Unauthorized</h1>
              <p className="lead">You do not have permission to view this page.</p>
              <div className="mt-3">
                <Link to="/" className="btn btn-secondary me-2">Go Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
