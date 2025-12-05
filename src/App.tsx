import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/home';
import Login from './pages/login';
import Registro from './pages/registro';
import Dashboard from './pages/dashboard';
import SpectatorDashboard from './pages/SpectatorDashboard';
import StreamerDashboard from './pages/StreamerDashboard';
import Recarga from './pages/recarga';
import About from './pages/about';
import Terms from './pages/terms';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/espectador" element={<ProtectedRoute requiredUserType="espectador"><SpectatorDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredUserType="streamer"><StreamerDashboard /></ProtectedRoute>} />
          <Route path="/recargar" element={<ProtectedRoute><Recarga /></ProtectedRoute>} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/terminos" element={<Terms />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
