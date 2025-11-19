import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Remove Bootstrap if you're fully using Tailwind, or keep it for compatibility
//import 'bootstrap/dist/css/bootstrap.min.css';
import MedicalReports from './pages/MedicalReports';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Prescriptions from './pages/Prescriptions';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import PatientList from './pages/PatientList';
import PatientForm from './components/patients/PatientForm';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import AppointmentForm from './components/appointments/AppointmentForm';
import Unauthorized from './pages/Unauthorized';
import PrivateRoute from './components/common/PrivateRoute';
import { authService } from './services/auth';

function App() {
  const currentUser = authService.getCurrentUser();

  return (
    <Router>
      <Routes>
        {/* Public routes - no header/footer */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes with Layout (includes Header & Footer) */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route
            path="patients/new"
            element={
              <PrivateRoute roles={['doctor', 'admin']}>
                <PatientForm />
              </PrivateRoute>
            }
          />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="appointments" element={<Appointments />} />
          <Route
            path="appointments/new"
            element={
              <PrivateRoute roles={['doctor', 'admin']}>
                <AppointmentForm />
              </PrivateRoute>
            }
          />
          <Route path="reports" element={<MedicalReports />} />
          <Route path="prescriptions" element={<Prescriptions />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;