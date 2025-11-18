import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients/patients/');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-4">Loading patients...</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Patients</h1>
        <Link to="/patients/new" className="btn btn-primary">
          Add New Patient
        </Link>
      </div>
      
      {patients.length === 0 ? (
        <div className="text-center mt-5">
          <h4>No patients found</h4>
          <p>Get started by adding your first patient.</p>
          <Link to="/patients/new" className="btn btn-primary">
            Add First Patient
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.first_name} {patient.last_name}</td>
                  <td>{patient.date_of_birth}</td>
                  <td>{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</td>
                  <td>{patient.phone || 'N/A'}</td>
                  <td>
                    <Link to={`/patients/${patient.id}`} className="btn btn-sm btn-outline-primary me-1">
                      View
                    </Link>
                    <button className="btn btn-sm btn-outline-secondary">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientList;