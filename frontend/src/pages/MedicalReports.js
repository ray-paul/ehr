// src/pages/MedicalReports.js
import React, { useEffect, useState } from 'react';
import { reportsService } from '../services/reports';
import { patientsService } from '../services/patients';
import { authService } from '../services/auth';
import { Link } from 'react-router-dom';

const MedicalReports = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', content: '', patient_id: '' });
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);

  const currentUser = authService.getCurrentUser() || {};
  const isProvider = ['doctor', 'nurse', 'admin'].includes(currentUser.user_type);
  const isResearcher = ['researcher', 'admin'].includes(currentUser.user_type);

  // Load reports and patients
  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, patientsData] = await Promise.all([
        reportsService.list(),
        patientsService.list()
      ]);
      
      const reportsList = Array.isArray(reportsData) ? reportsData : (reportsData.results || reportsData.value || []);
      const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.results || patientsData.value || []);
      
      setReports(reportsList);
      setPatients(patientsList);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter reports by patient
  const filteredReports = selectedPatientFilter === 'all' 
    ? reports 
    : reports.filter(report => report.patient_id?.toString() === selectedPatientFilter);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!isProvider || !newReport.patient_id) return;
    
    setCreating(true);
    try {
      await reportsService.create({
        title: newReport.title,
        content: newReport.content,
        patient_id: newReport.patient_id
      });
      await loadData();
      setShowCreateModal(false);
      setNewReport({ title: '', content: '', patient_id: '' });
    } catch (err) {
      setError('Failed to create report');
      console.error('Create failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUploadAttachment = async (reportId, file, attachment_type) => {
    if (!isProvider || !file) return;
    
    setUploading(true);
    try {
      await reportsService.uploadAttachment(reportId, file, attachment_type);
      await loadData();
    } catch (err) {
      setError('Failed to upload attachment');
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!isProvider) return;
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await reportsService.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete report');
      console.error('Delete failed', err);
    }
  };

  // Analytics/Research functionality
  const fetchAnonymizedData = async () => {
    try {
      const data = await reportsService.getAnonymizedReports();
      setAnalyticsData(data);
      setShowAnalyticsModal(true);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    }
  };

  const exportAnonymizedData = async () => {
    try {
      const data = await reportsService.exportAnonymizedReports();
      // Create and download CSV file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anonymized_reports_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
      console.error('Export error:', err);
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id?.toString() === patientId?.toString());
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getAttachmentIcon = (type) => {
    switch (type) {
      case 'lab': return 'fas fa-flask';
      case 'escript': return 'fas fa-prescription';
      case 'radiography': return 'fas fa-x-ray';
      case 'diagnostic': return 'fas fa-stethoscope';
      default: return 'fas fa-file-medical';
    }
  };

  const getAttachmentColor = (type) => {
    switch (type) {
      case 'lab': return 'text-purple-600';
      case 'escript': return 'text-green-600';
      case 'radiography': return 'text-blue-600';
      case 'diagnostic': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
              <p className="text-gray-600 mt-2">Manage and view patient medical reports and attachments</p>
            </div>
            {isResearcher && (
              <button
                onClick={fetchAnonymizedData}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <i className="fas fa-chart-bar"></i>
                <span>Research Analytics</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Patient Filter */}
            <select
              value={selectedPatientFilter}
              onChange={(e) => setSelectedPatientFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Patients</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>
          
          {isProvider && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>New Report</span>
            </button>
          )}
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <i className="fas fa-file-medical text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500 mb-4">
              {selectedPatientFilter === 'all' 
                ? 'No medical reports available in the system.' 
                : 'No reports found for the selected patient.'}
            </p>
            {isProvider && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Report
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Report Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {report.title}
                    </h3>
                    {isProvider && (
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  
                  {report.patient_name && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <i className="fas fa-user-injured mr-2"></i>
                      <span>{report.patient_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="far fa-clock mr-2"></i>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Report Content */}
                {report.content && (
                  <div className="p-6 border-b border-gray-200">
                    <p className="text-gray-700 text-sm">{report.content}</p>
                  </div>
                )}

                {/* Attachments */}
                {report.attachments && report.attachments.length > 0 && (
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {report.attachments.map(attachment => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <i className={`${getAttachmentIcon(attachment.attachment_type)} ${getAttachmentColor(attachment.attachment_type)} text-lg`}></i>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {attachment.file_name || attachment.attachment_type}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {attachment.attachment_type}
                            </p>
                          </div>
                          <i className="fas fa-download text-gray-400 group-hover:text-blue-600"></i>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Section for Providers */}
                {isProvider && (
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="lab">Lab Report</option>
                        <option value="escript">E-Script</option>
                        <option value="radiography">Radiography</option>
                        <option value="diagnostic">Diagnostic Report</option>
                      </select>
                      <input
                        type="file"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          const select = e.target.previousElementSibling;
                          if (file) {
                            handleUploadAttachment(report.id, file, select.value);
                          }
                        }}
                      />
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center text-sm text-gray-500">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Uploading...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Report Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create New Report</h3>
              </div>
              
              <form onSubmit={handleCreateReport} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select
                    required
                    value={newReport.patient_id}
                    onChange={(e) => setNewReport({...newReport, patient_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReport.title}
                    onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter report title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (Optional)
                  </label>
                  <textarea
                    value={newReport.content}
                    onChange={(e) => setNewReport({...newReport, content: e.target.value})}
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter report content"
                  />
                </div>
              </form>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateReport}
                  disabled={creating || !newReport.title || !newReport.patient_id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics/Research Modal */}
        {showAnalyticsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Research Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">Anonymized report data for research purposes</p>
              </div>
              
              <div className="p-6">
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Reports</p>
                    <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Unique Patients</p>
                    <p className="text-2xl font-bold text-green-900">
                      {[...new Set(reports.map(r => r.patient_id))].length}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Avg Attachments</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(reports.reduce((acc, r) => acc + (r.attachments?.length || 0), 0) / reports.length).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={exportAnonymizedData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <i className="fas fa-download"></i>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAnalyticsModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalReports;