// src/pages/LabResults.js
import React, { useEffect, useState } from 'react';
import labResultsService from '../services/LabResults';
import { patientsService } from '../services/patients';
import { authService } from '../services/auth';
import { Link } from 'react-router-dom';

const LabResults = () => {
  const [labResults, setLabResults] = useState([]);
  const [patients, setPatients] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [testTypeFilter, setTestTypeFilter] = useState('all');

  const [newLabResult, setNewLabResult] = useState({
    patient_id: '',
    test_type: '',
    test_name: '',
    result_value: '',
    unit: '',
    reference_range: '',
    notes: '',
    status: 'pending'
  });

  const [uploadFile, setUploadFile] = useState({
    file: null,
    file_type: 'report'
  });

  const currentUser = authService.getCurrentUser() || {};
  const isProvider = ['doctor', 'nurse', 'lab_technician', 'admin'].includes(currentUser.user_type);

  // Load lab results, patients, and test types
  const loadData = async () => {
    setLoading(true);
    try {
      const [labResultsData, patientsData, testTypesData] = await Promise.all([
        labResultsService.list(),
        patientsService.list(),
        labResultsService.getTestTypes()
      ]);
      
      const labResultsList = Array.isArray(labResultsData) ? labResultsData : (labResultsData.results || labResultsData.value || []);
      const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.results || patientsData.value || []);
      
      setLabResults(labResultsList);
      setPatients(patientsList);
      setTestTypes(testTypesData || []);
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

  // Filter lab results
  const filteredLabResults = labResults.filter(result => {
    const patientMatch = selectedPatientFilter === 'all' || result.patient_id?.toString() === selectedPatientFilter;
    const statusMatch = statusFilter === 'all' || result.status === statusFilter;
    const testTypeMatch = testTypeFilter === 'all' || result.test_type === testTypeFilter;
    return patientMatch && statusMatch && testTypeMatch;
  });

  const handleCreateLabResult = async (e) => {
    e.preventDefault();
    if (!isProvider || !newLabResult.patient_id || !newLabResult.test_name) return;
    
    setCreating(true);
    try {
      await labResultsService.create(newLabResult);
      await loadData();
      setShowCreateModal(false);
      setNewLabResult({
        patient_id: '',
        test_type: '',
        test_name: '',
        result_value: '',
        unit: '',
        reference_range: '',
        notes: '',
        status: 'pending'
      });
    } catch (err) {
      setError('Failed to create lab result');
      console.error('Create failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile.file || !selectedLabResult) return;
    
    setUploading(true);
    try {
      await labResultsService.uploadFile(selectedLabResult.id, uploadFile.file, uploadFile.file_type);
      await loadData();
      setShowUploadModal(false);
      setUploadFile({ file: null, file_type: 'report' });
      setSelectedLabResult(null);
    } catch (err) {
      setError('Failed to upload file');
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (labResultId, status) => {
    try {
      if (status === 'reviewed') {
        await labResultsService.markAsReviewed(labResultId);
      } else if (status === 'critical') {
        await labResultsService.markAsCritical(labResultId);
      }
      await loadData();
    } catch (err) {
      setError('Failed to update lab result status');
      console.error('Status update failed:', err);
    }
  };

  const handleDeleteLabResult = async (id) => {
    if (!isProvider) return;
    if (!window.confirm('Are you sure you want to delete this lab result?')) return;
    
    try {
      await labResultsService.delete(id);
      setLabResults(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete lab result');
      console.error('Delete failed', err);
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id?.toString() === patientId?.toString());
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: 'fas fa-clock' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: 'fas fa-check' },
      reviewed: { color: 'bg-blue-100 text-blue-800', label: 'Reviewed', icon: 'fas fa-eye' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical', icon: 'fas fa-exclamation-triangle' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: 'fas fa-times' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <i className={`${config.icon} mr-1`}></i>
        {config.label}
      </span>
    );
  };

  const getTestTypeIcon = (testType) => {
    const iconConfig = {
      blood: 'fas fa-tint',
      urine: 'fas fa-flask',
      imaging: 'fas fa-x-ray',
      microbiology: 'fas fa-microscope',
      pathology: 'fas fa-dna',
      chemistry: 'fas fa-vial',
      hematology: 'fas fa-prescription-bottle',
      immunology: 'fas fa-shield-alt'
    };
    return iconConfig[testType] || 'fas fa-file-medical';
  };

  const isResultAbnormal = (result) => {
    if (!result.reference_range || !result.result_value) return false;
    
    // Simple check for abnormal results (this would be more complex in reality)
    const range = result.reference_range.toLowerCase();
    const value = parseFloat(result.result_value);
    
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(v => parseFloat(v.trim()));
      return value < min || value > max;
    }
    
    return false;
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
          <h1 className="text-3xl font-bold text-gray-900">Laboratory Results</h1>
          <p className="text-gray-600 mt-2">Manage and review laboratory test results and reports</p>
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
                placeholder="Search lab results..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Patient Filter */}
            {isProvider && (
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
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
              <option value="critical">Critical</option>
            </select>

            {/* Test Type Filter */}
            <select
              value={testTypeFilter}
              onChange={(e) => setTestTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Test Types</option>
              {testTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
              <span>New Lab Result</span>
            </button>
          )}
        </div>

        {/* Lab Results Grid */}
        {filteredLabResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <i className="fas fa-microscope text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lab Results Found</h3>
            <p className="text-gray-500 mb-4">
              {selectedPatientFilter === 'all' 
                ? 'No laboratory results available in the system.' 
                : 'No lab results found for the selected patient.'}
            </p>
            {isProvider && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Lab Result
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLabResults.map(result => (
              <div key={result.id} className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                result.status === 'critical' ? 'border-red-300' : 'border-gray-200'
              }`}>
                {/* Lab Result Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <i className={`${getTestTypeIcon(result.test_type)} text-xl text-blue-600`}></i>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.test_name}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">{result.test_type}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {getStatusBadge(result.status)}
                      {isProvider && (
                        <button
                          onClick={() => handleDeleteLabResult(result.id)}
                          className="text-red-500 hover:text-red-700 transition-colors ml-2"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Patient Info */}
                  {result.patient_id && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <i className="fas fa-user-injured mr-2"></i>
                      <Link 
                        to={`/patients/${result.patient_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {getPatientName(result.patient_id)}
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="far fa-clock mr-2"></i>
                    <span>Collected: {new Date(result.collected_at || result.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Lab Result Details */}
                <div className="p-6">
                  {result.result_value && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      isResultAbnormal(result) ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-700">Result:</span>
                          <p className={`text-2xl font-bold ${
                            isResultAbnormal(result) ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {result.result_value} {result.unit}
                          </p>
                        </div>
                        {isResultAbnormal(result) && (
                          <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                        )}
                      </div>
                      {result.reference_range && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reference: {result.reference_range}
                        </p>
                      )}
                    </div>
                  )}

                  {result.notes && (
                    <div className="mb-4">
                      <span className="font-medium text-gray-700 text-sm">Notes:</span>
                      <p className="text-gray-900 text-sm mt-1">{result.notes}</p>
                    </div>
                  )}

                  {/* Files */}
                  {result.files && result.files.length > 0 && (
                    <div className="mb-4">
                      <span className="font-medium text-gray-700 text-sm">Attachments:</span>
                      <div className="mt-2 space-y-2">
                        {result.files.map(file => (
                          <a
                            key={file.id}
                            href={file.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <i className="fas fa-file-pdf text-red-500"></i>
                            <span className="text-sm text-gray-700 group-hover:text-blue-600">
                              {file.file_name || 'Lab Report'}
                            </span>
                            <i className="fas fa-download text-gray-400 group-hover:text-blue-600 ml-auto"></i>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {isProvider && result.status === 'completed' && (
                      <button
                        onClick={() => handleStatusUpdate(result.id, 'reviewed')}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-eye mr-2"></i>
                        Mark Reviewed
                      </button>
                    )}
                    
                    {isProvider && result.status !== 'critical' && (
                      <button
                        onClick={() => handleStatusUpdate(result.id, 'critical')}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Mark Critical
                      </button>
                    )}

                    {isProvider && (
                      <button
                        onClick={() => {
                          setSelectedLabResult(result);
                          setShowUploadModal(true);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-upload mr-2"></i>
                        Upload File
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Lab Result Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Lab Result</h3>
              </div>
              
              <form onSubmit={handleCreateLabResult} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select
                    required
                    value={newLabResult.patient_id}
                    onChange={(e) => setNewLabResult({...newLabResult, patient_id: e.target.value})}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Type *
                    </label>
                    <select
                      required
                      value={newLabResult.test_type}
                      onChange={(e) => setNewLabResult({...newLabResult, test_type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select test type</option>
                      {testTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLabResult.test_name}
                      onChange={(e) => setNewLabResult({...newLabResult, test_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Complete Blood Count"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Result Value
                    </label>
                    <input
                      type="text"
                      value={newLabResult.result_value}
                      onChange={(e) => setNewLabResult({...newLabResult, result_value: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 12.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={newLabResult.unit}
                      onChange={(e) => setNewLabResult({...newLabResult, unit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., mg/dL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Range
                    </label>
                    <input
                      type="text"
                      value={newLabResult.reference_range}
                      onChange={(e) => setNewLabResult({...newLabResult, reference_range: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 10-20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newLabResult.notes}
                    onChange={(e) => setNewLabResult({...newLabResult, notes: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes or observations..."
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
                  onClick={handleCreateLabResult}
                  disabled={creating || !newLabResult.patient_id || !newLabResult.test_type || !newLabResult.test_name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Add Lab Result'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload File Modal */}
        {showUploadModal && selectedLabResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Upload Lab File</h3>
                <p className="text-sm text-gray-600 mt-1">Upload file for: {selectedLabResult.test_name}</p>
              </div>
              
              <form onSubmit={handleUploadFile} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Type
                  </label>
                  <select
                    value={uploadFile.file_type}
                    onChange={(e) => setUploadFile({...uploadFile, file_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="report">Lab Report</option>
                    <option value="image">Image</option>
                    <option value="raw_data">Raw Data</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile({...uploadFile, file: e.target.files[0]})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </form>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedLabResult(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadFile}
                  disabled={uploading || !uploadFile.file}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabResults;