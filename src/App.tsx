import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import DieticianDashboard from './pages/DieticianDashboard';
import PatientDashboard from './pages/PatientDashboard';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole: 'dietician' | 'patient' }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }
  
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== requiredRole) {
    return <Navigate to={profile.role === 'dietician' ? '/dietician' : '/patient'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={user && profile ? <Navigate to={`/${profile.role}`} replace /> : <Home />} />
      <Route path="/login" element={user && profile ? <Navigate to={`/${profile.role}`} replace /> : <Login />} />
      
      <Route path="/dietician/*" element={<ProtectedRoute requiredRole="dietician"><DieticianDashboard /></ProtectedRoute>} />
      <Route path="/patient/*" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
