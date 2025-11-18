// frontend/src/pages/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>

      <div className="mt-4">
        {/* Vertical stacked cards with float animation */}
        <div className="mb-6 float-card card">
          <div className="card-body">
            <h5 className="card-title">Patients</h5>
            <p className="card-text">Manage patient records</p>
            <Link to="/patients" className="btn btn-primary">View Patients</Link>
          </div>
        </div>

        <div className="mb-6 float-card card">
          <div className="card-body">
            <h5 className="card-title">Appointments</h5>
            <p className="card-text">Schedule and manage appointments</p>
            <Link to="/appointments" className="btn btn-primary">View Appointments</Link>
          </div>
        </div>

        <div className="mb-6 float-card card">
          <div className="card-body">
            <h5 className="card-title">Reports</h5>
            <p className="card-text">Generate and export reports</p>
            <button className="btn btn-secondary" disabled>Coming Soon</button>
          </div>
        </div>
      </div>

      <script>
        {`(function() {
          const els = document.querySelectorAll('.float-card');
          if (!els.length) return;
          const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
          }, { threshold: 0.2 });
          els.forEach(el => obs.observe(el));
        })();`}
      </script>
    </div>
  );
};

export default Dashboard;