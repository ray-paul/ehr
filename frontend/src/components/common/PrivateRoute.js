// frontend/src/components/common/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const PrivateRoute = ({ children }) => {
  const currentUser = authService.getCurrentUser();
  return currentUser ? children : <Navigate to="/login" />;
};

export default PrivateRoute;