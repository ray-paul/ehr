// frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import useFloatOnView from '../hooks/useFloatOnView';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { reportsService } from '../services/reports';

const Dashboard = () => {
  useFloatOnView();

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginMsg, setLoginMsg] = useState(null);

  const currentUser = authService.getCurrentUser() || {};

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      // fetch recent reports (no patient filter)
      const data = await reportsService.list();
      // normalize list
      const list = Array.isArray(data) ? data : (data.results || data.value || []);
      setReports(list.slice(0, 10));
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAdminLogin = async () => {
    setLoginMsg(null);
    try {
      const resp = await authService.login(loginUser, loginPass);
      if (resp && resp.user) {
        setLoginMsg('Logged in as ' + (resp.user.username || resp.user.email));
        await loadReports();
      } else {
        setLoginMsg('Login failed');
      }
    } catch (err) {
      console.error('Login error', err);
      setLoginMsg('Login error');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Dashboard cards with float animation */}
        <div 
          className="float-card bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
          style={{ 
            transform: 'translateY(0px)', 
            opacity: 1 
          }}
        >
          <div className="card-body">
            <h5 className="card-title text-xl font-semibold mb-2">Patients</h5>
            <p className="card-text text-gray-600 mb-4">Manage patient records</p>
            <Link 
              to="/patients" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block"
            >
              View Patients
            </Link>
          </div>
        </div>

        <div 
          className="float-card bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
          style={{ 
            transform: 'translateY(0px)', 
            opacity: 1 
          }}
        >
          <div className="card-body">
            <h5 className="card-title text-xl font-semibold mb-2">Appointments</h5>
            <p className="card-text text-gray-600 mb-4">Schedule and manage appointments</p>
            <Link 
              to="/appointments" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block"
            >
              View Appointments
            </Link>
          </div>
        </div>

        <div 
          className="float-card bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
          style={{ 
            transform: 'translateY(0px)', 
            opacity: 1 
          }}
        >
          <div className="card-body">
            <h5 className="card-title text-xl font-semibold mb-2">Reports</h5>
            <p className="card-text text-gray-600 mb-4">Recent reports and attachments</p>
            <Link 
              to="/reports" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block"
            >
              View All Reports
            </Link>
            <div className="mt-3">
              {currentUser && currentUser.user_type ? (
                <div className="text-sm text-gray-600">
                  Signed in as <strong>{currentUser.user_type}</strong>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input 
                    placeholder="admin username" 
                    value={loginUser} 
                    onChange={e => setLoginUser(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input 
                    placeholder="password" 
                    type="password" 
                    value={loginPass} 
                    onChange={e => setLoginPass(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    onClick={handleAdminLogin}
                  >
                    Admin Login
                  </button>
                </div>
              )}
              {loginMsg && (
                <div className="mt-2 text-sm text-gray-700 p-2 bg-gray-100 rounded">
                  {loginMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="float-card bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
        style={{ 
          transform: 'translateY(0px)', 
          opacity: 1 
        }}
      >
        <h2 className="text-2xl font-semibold mb-4">Recent Reports</h2>
        {loadingReports ? (
          <div className="text-gray-600 py-4">Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="text-gray-600 py-4">No reports found.</div>
        ) : (
          <ul className="space-y-4">
            {reports.map(r => (
              <li 
                key={r.id} 
                className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1">
                    <strong className="text-lg text-gray-800 block mb-1">
                      {r.title}
                    </strong>
                    <div className="text-gray-600 text-sm">
                      {r.patient_name || 'No patient name'} — {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {r.attachments && r.attachments.map(a => (
                      <a 
                        key={a.id} 
                        href={a.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        {a.file_name}
                      </a>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;