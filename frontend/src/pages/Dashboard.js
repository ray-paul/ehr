// frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
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
      const data = await reportsService.list();
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

  // Get user display name for title
  const getUserDisplayName = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    }
    if (currentUser?.username) {
      return currentUser.username;
    }
    return 'Dashboard';
  };

  return (
    <>
      <Helmet>
        <title>{`${getUserDisplayName()} | Dashboard | EHR System`}</title>
        <meta name="description" content="View your medical dashboard with patient overview, upcoming appointments, and recent medical reports." />
      </Helmet>
      
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Dashboard</h1>

        {/* Cards Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Patients Card */}
          <div 
            className="float-card bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
            style={{ transform: 'translateY(0px)', opacity: 1 }}
          >
            <div className="card-body">
              <h5 className="card-title text-lg sm:text-xl font-semibold mb-2">Patients</h5>
              <p className="card-text text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Manage patient records</p>
              <Link 
                to="/patients" 
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base hover:bg-blue-700 transition-colors inline-block text-center"
              >
                View Patients
              </Link>
            </div>
          </div>

          {/* Appointments Card */}
          <div 
            className="float-card bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
            style={{ transform: 'translateY(0px)', opacity: 1 }}
          >
            <div className="card-body">
              <h5 className="card-title text-lg sm:text-xl font-semibold mb-2">Appointments</h5>
              <p className="card-text text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Schedule and manage appointments</p>
              <Link 
                to="/appointments" 
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base hover:bg-blue-700 transition-colors inline-block text-center"
              >
                View Appointments
              </Link>
            </div>
          </div>

          {/* Reports Card */}
          <div 
            className="float-card bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
            style={{ transform: 'translateY(0px)', opacity: 1 }}
          >
            <div className="card-body">
              <h5 className="card-title text-lg sm:text-xl font-semibold mb-2">Reports</h5>
              <p className="card-text text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Recent reports and attachments</p>
              <Link 
                to="/reports" 
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base hover:bg-blue-700 transition-colors inline-block text-center mb-3"
              >
                View All Reports
              </Link>
              
              <div className="mt-2">
                {currentUser && currentUser.user_type ? (
                  <div className="text-xs sm:text-sm text-gray-600">
                    Signed in as <strong className="break-words">{currentUser.user_type}</strong>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input 
                      placeholder="Username" 
                      value={loginUser} 
                      onChange={e => setLoginUser(e.target.value)}
                      className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                    <input 
                      placeholder="Password" 
                      type="password" 
                      value={loginPass} 
                      onChange={e => setLoginPass(e.target.value)}
                      className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                    <button 
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                      onClick={handleAdminLogin}
                    >
                      Admin Login
                    </button>
                  </div>
                )}
                {loginMsg && (
                  <div className="mt-2 text-xs sm:text-sm text-gray-700 p-2 bg-gray-100 rounded break-words">
                    {loginMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Reports Section */}
        <div 
          className="float-card bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300"
          style={{ transform: 'translateY(0px)', opacity: 1 }}
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Recent Reports</h2>
          
          {loadingReports ? (
            <div className="text-gray-600 py-4 text-center">Loading reports…</div>
          ) : reports.length === 0 ? (
            <div className="text-gray-600 py-4 text-center">No reports found.</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
                  {reports.map(r => (
                    <div 
                      key={r.id} 
                      className="border-b border-gray-200 pb-3 sm:pb-4 last:border-b-0"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <strong className="text-base sm:text-lg text-gray-800 block mb-1 break-words">
                            {r.title}
                          </strong>
                          <div className="text-gray-600 text-xs sm:text-sm break-words">
                            {r.patient_name || 'No patient name'} — {new Date(r.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 lg:mt-0">
                          {r.attachments && r.attachments.map(a => (
                            <a 
                              key={a.id} 
                              href={a.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm bg-blue-50 px-2 sm:px-3 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
                            >
                              {a.file_name.length > 20 ? a.file_name.substring(0, 20) + '...' : a.file_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;