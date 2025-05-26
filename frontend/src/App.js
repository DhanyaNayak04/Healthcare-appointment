import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SearchDoctors from './pages/SearchDoctors';
import DoctorProfile from './pages/DoctorProfile';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import SubmitFeedback from './pages/SubmitFeedback';
import NotFound from './pages/NotFound';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorProfileSettings from './pages/doctor/DoctorProfile';
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      {/* Main app routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Routes for all authenticated users */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Patient routes */}
        <Route path="/search-doctors" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <SearchDoctors />
          </ProtectedRoute>
        } />
        <Route path="/doctors/:id" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DoctorProfile />
          </ProtectedRoute>
        } />
        <Route path="/book-appointment/:doctorId" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <BookAppointment />
          </ProtectedRoute>
        } />
        <Route path="/my-appointments" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <MyAppointments />
          </ProtectedRoute>
        } />
        <Route path="/submit-feedback/:appointmentId" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <SubmitFeedback />
          </ProtectedRoute>
        } />
        
        {/* Doctor routes */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor/appointments" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        } />
        <Route path="/doctor/profile" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfileSettings />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
