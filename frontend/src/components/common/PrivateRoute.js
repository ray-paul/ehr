// frontend/src/components/common/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';

/**
 * PrivateRoute enforces authentication and optional role-based access.
 * Props:
 * - children: node to render when allowed
 * - roles: optional array of allowed roles (e.g. ['admin','doctor', 'master_admin'])
 */
const PrivateRoute = ({ children, roles = [] }) => {
  const currentUser = authService.getCurrentUser();
  const location = useLocation();

  console.log('🔐 PrivateRoute Check:');
  console.log('Current user:', currentUser);
  console.log('Required roles:', roles);

  if (!currentUser) {
    console.log('❌ No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role - using user_type
  if (roles && roles.length > 0) {
    const userRole = currentUser.user_type;
    
    console.log('User role (user_type):', userRole);
    console.log('Is allowed?', roles.includes(userRole));
    
    if (!roles.includes(userRole)) {
      console.log(`❌ Role "${userRole}" not in allowed roles:`, roles);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ Access granted');
  return children;
};

export default PrivateRoute;