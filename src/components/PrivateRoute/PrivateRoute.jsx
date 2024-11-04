import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { isTokenExpired } from '../../utils/authUtils';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, logout } = useContext(AuthContext);

  if (!user || !user.id_token) {
    return <Navigate to='/login' />;
  }

  if (isTokenExpired(user.id_token)) {
    logout();
    return <Navigate to='/login' />;
  }

  const { isService, isManager } = user.role || {};
  const userRole = isService ? 'service' : isManager ? 'manager' : 'worker';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to='/unauthorized' />;
  }

  return children;
};

export default PrivateRoute;
