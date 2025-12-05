import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserType } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredUserType?: UserType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredUserType }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredUserType && user?.userType !== requiredUserType) {
    if (user?.userType === 'espectador') {
      return <Navigate to="/espectador" replace />;
    } else if (user?.userType === 'streamer') {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
