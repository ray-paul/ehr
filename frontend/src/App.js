// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MedicalReports from './pages/MedicalReports';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Register from './components/auth/Register';
import Prescriptions from './pages/Prescriptions';
import LabResults from './pages/LabResults';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import PatientList from './pages/PatientList';
import PatientForm from './components/patients/PatientForm';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import AppointmentDetail from './pages/AppointmentDetail';
import AppointmentForm from './components/appointments/AppointmentForm';
import Unauthorized from './pages/Unauthorized';
import PrivateRoute from './components/common/PrivateRoute';
import { authService } from './services/auth';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  const currentUser = authService.getCurrentUser();

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
              <PrivateRoute roles={['doctor', 'admin', 'master_admin']}>
                <PatientForm />
              </PrivateRoute>
            }
          />
          <Route path="patients/:id" element={<PatientDetail />} />
          {/* ADD THIS LINE - Edit patient route */}
          <Route
            path="patients/:id/edit"
            element={
              <PrivateRoute roles={['doctor', 'admin', 'master_admin']}>
                <PatientForm />
              </PrivateRoute>
            }
          />
          
          {/* Appointments routes */}
          <Route path="appointments" element={<Appointments />} />
          <Route
            path="appointments/new"
            element={
              <PrivateRoute roles={['doctor', 'admin', 'master_admin', 'patient']}>
                <AppointmentForm />
              </PrivateRoute>
            }
          />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          
          <Route path="reports" element={<MedicalReports />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="lab-results" element={<LabResults />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Admin routes */}
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;