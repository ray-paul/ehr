// frontend/src/components/common/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';

/**
 * PrivateRoute enforces authentication and optional role-based access.
 * Props:
 * - children: node to render when allowed
 * - roles: optional array of allowed roles (e.g. ['admin','doctor'])
 */
const PrivateRoute = ({ children, roles }) => {
  const currentUser = authService.getCurrentUser();
  const location = useLocation();

  if (!currentUser) {
    // Not authenticated -> redirect to login, preserve return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    const userRole = currentUser.role || currentUser.roles || null;
    // support both single `role` or array `roles` on user object
    const allowed = Array.isArray(userRole)
      ? roles.some((r) => userRole.includes(r))
      : roles.includes(userRole);

    if (!allowed) {
      // Authenticated but not authorized
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default PrivateRoute;