// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import PatientList from './pages/PatientList';
import PatientForm from './components/patients/PatientForm';
import PatientDetail from './pages/PatientDetail';
import PrivateRoute from './components/common/PrivateRoute';
import { authService } from './services/auth';

function App() {
  const currentUser = authService.getCurrentUser();

  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/new" element={<PatientForm />} />
          <Route path="patients/:id" element={<PatientDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;