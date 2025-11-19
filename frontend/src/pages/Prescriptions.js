// src/pages/Prescriptions.js
import React, { useEffect, useState } from 'react';
import { prescriptionsService } from '../services/prescriptions';
import { patientsService } from '../services/patients';
import { authService } from '../services/auth';
import { Link } from 'react-router-dom';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrugSearch, setShowDrugSearch] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    drug_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills: 0
  });

  const currentUser = authService.getCurrentUser() || {};
  const isProvider = ['doctor', 'nurse', 'admin'].includes(currentUser.user_type);
  const isPharmacist = ['pharmacist', 'admin'].includes(currentUser.user_type);

  // Load prescriptions and patients
  const loadData = async () => {
    setLoading(true);
    try {
      const [prescriptionsData, patientsData] = await Promise.all([
        prescriptionsService.list(),
        patientsService.list()
      ]);
      
      const prescriptionsList = Array.isArray(prescriptionsData) ? prescriptionsData : (prescriptionsData.results || prescriptionsData.value || []);
      const patientsList = Array.isArray(patientsData) ? patientsData : (patientsData.results || patientsData.value || []);
      
      setPrescriptions(prescriptionsList);
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

  // Search drugs
  useEffect(() => {
    const searchDrugs = async () => {
      if (drugSearchQuery.length > 2) {
        try {
          const results = await prescriptionsService.searchDrugs(drugSearchQuery);
          setDrugs(results);
        } catch (err) {
          console.error('Drug search error:', err);
        }
      } else {
        setDrugs([]);
      }
    };

    const timeoutId = setTimeout(searchDrugs, 300);
    return () => clearTimeout(timeoutId);
  }, [drugSearchQuery]);

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patientMatch = selectedPatientFilter === 'all' || prescription.patient_id?.toString() === selectedPatientFilter;
    const statusMatch = statusFilter === 'all' || prescription.status === statusFilter;
    return patientMatch && statusMatch;
  });

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!isProvider || !newPrescription.patient_id || !newPrescription.drug_name) return;
    
    setCreating(true);
    try {
      await prescriptionsService.create(newPrescription);
      await loadData();
      setShowCreateModal(false);
      setNewPrescription({
        patient_id: '',
        drug_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        refills: 0
      });
    } catch (err) {
      setError('Failed to create prescription');
      console.error('Create failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (prescriptionId, status) => {
    try {
      if (status === 'dispensed') {
        await prescriptionsService.markAsDispensed(prescriptionId);
      } else if (status === 'cancelled') {
        await prescriptionsService.markAsCancelled(prescriptionId);
      }
      await loadData();
    } catch (err) {
      setError('Failed to update prescription status');
      console.error('Status update failed:', err);
    }
  };

  const handleDeletePrescription = async (id) => {
    if (!isProvider) return;
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    
    try {
      await prescriptionsService.delete(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete prescription');
      console.error('Delete failed', err);
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id?.toString() === patientId?.toString());
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      dispensed: { color: 'bg-blue-100 text-blue-800', label: 'Dispensed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
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
          <h1 className="text-3xl font-bold text-gray-900">e-Scripts & Prescriptions</h1>
          <p className="text-gray-600 mt-2">Manage electronic prescriptions and medication orders</p>
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
                placeholder="Search prescriptions..."
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
              <option value="active">Active</option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          {isProvider && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <i className="fas fa-prescription"></i>
              <span>New e-Script</span>
            </button>
          )}
        </div>

        {/* Prescriptions Grid */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <i className="fas fa-prescription-bottle text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
            <p className="text-gray-500 mb-4">
              {selectedPatientFilter === 'all' 
                ? 'No prescriptions available in the system.' 
                : 'No prescriptions found for the selected patient.'}
            </p>
            {isProvider && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create e-Script
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPrescriptions.map(prescription => (
              <div key={prescription.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Prescription Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prescription.drug_name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(prescription.status)}
                        {isExpired(prescription.expiry_date) && prescription.status === 'active' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {isProvider && (
                        <button
                          onClick={() => handleDeletePrescription(prescription.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Patient Info */}
                  {prescription.patient_id && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <i className="fas fa-user-injured mr-2"></i>
                      <Link 
                        to={`/patients/${prescription.patient_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {getPatientName(prescription.patient_id)}
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="far fa-clock mr-2"></i>
                    <span>Prescribed: {new Date(prescription.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Prescription Details */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Dosage:</span>
                      <p className="text-gray-900">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Frequency:</span>
                      <p className="text-gray-900">{prescription.frequency}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>
                      <p className="text-gray-900">{prescription.duration}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Refills:</span>
                      <p className="text-gray-900">{prescription.refills} remaining</p>
                    </div>
                  </div>
                  
                  {prescription.instructions && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700 text-sm">Instructions:</span>
                      <p className="text-gray-900 text-sm mt-1">{prescription.instructions}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    {isPharmacist && prescription.status === 'active' && !isExpired(prescription.expiry_date) && (
                      <button
                        onClick={() => handleStatusUpdate(prescription.id, 'dispensed')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-check-circle mr-2"></i>
                        Mark as Dispensed
                      </button>
                    )}
                    
                    {isProvider && prescription.status === 'active' && (
                      <button
                        onClick={() => handleStatusUpdate(prescription.id, 'cancelled')}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <i className="fas fa-times-circle mr-2"></i>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Prescription Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create New e-Script</h3>
              </div>
              
              <form onSubmit={handleCreatePrescription} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select
                    required
                    value={newPrescription.patient_id}
                    onChange={(e) => setNewPrescription({...newPrescription, patient_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} ({patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() + ' years' : 'Age unknown'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drug Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPrescription.drug_name}
                    onChange={(e) => {
                      setNewPrescription({...newPrescription, drug_name: e.target.value});
                      setShowDrugSearch(true);
                      setDrugSearchQuery(e.target.value);
                    }}
                    onFocus={() => setShowDrugSearch(true)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for medication..."
                  />
                  
                  {/* Drug Search Results */}
                  {showDrugSearch && drugs.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {drugs.map((drug, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          onClick={() => {
                            setNewPrescription({...newPrescription, drug_name: drug.name});
                            setShowDrugSearch(false);
                            setDrugs([]);
                          }}
                        >
                          <div className="font-medium text-gray-900">{drug.name}</div>
                          <div className="text-sm text-gray-500">{drug.strength} • {drug.form}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrescription.dosage}
                      onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrescription.frequency}
                      onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Once daily"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrescription.duration}
                      onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refills
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={newPrescription.refills}
                      onChange={(e) => setNewPrescription({...newPrescription, refills: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={newPrescription.instructions}
                    onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional instructions for the patient..."
                  />
                </div>
              </form>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowDrugSearch(false);
                    setDrugs([]);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrescription}
                  disabled={creating || !newPrescription.patient_id || !newPrescription.drug_name || !newPrescription.dosage || !newPrescription.frequency || !newPrescription.duration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Create e-Script'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;