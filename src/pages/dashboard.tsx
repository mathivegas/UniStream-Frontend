import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SpectatorDashboard from './SpectatorDashboard';
import StreamerDashboard from './StreamerDashboard';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return user.userType === 'streamer' ? <StreamerDashboard /> : <SpectatorDashboard />;
}
