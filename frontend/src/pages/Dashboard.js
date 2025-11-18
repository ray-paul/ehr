// frontend/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Patients</h5>
              <p className="card-text">Manage patient records</p>
              <Link to="/patients" className="btn btn-primary">View Patients</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Appointments</h5>
              <p className="card-text">Schedule and manage appointments</p>
              <button className="btn btn-secondary" disabled>Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;