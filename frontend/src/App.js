import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DoctorProfile from './pages/DoctorProfile';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorProfileEdit from './pages/doctor/DoctorProfile';
import MyAppointments from './pages/MyAppointments';
import SearchDoctors from './pages/SearchDoctors';
import BookAppointment from './pages/BookAppointment';
import SubmitFeedback from './pages/SubmitFeedback';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminSpecializations from './pages/admin/AdminSpecializations';
import AdminReports from './pages/admin/AdminReports';
import NotFound from './pages/NotFound';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Protected route component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  // If still loading auth state, show loading
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        {/* Main layout routes */}
        <Route element={<MainLayout />}>
          {/* Common routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          
          {/* Patient routes */}
          <Route 
            path="/search-doctors" 
            element={
              <ProtectedRoute requiredRole="patient">
                <SearchDoctors />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/my-appointments" 
            element={
              <ProtectedRoute requiredRole="patient">
                <MyAppointments />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/book-appointment/:doctorId" 
            element={
              <ProtectedRoute requiredRole="patient">
                <BookAppointment />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/submit-feedback/:appointmentId" 
            element={
              <ProtectedRoute requiredRole="patient">
                <SubmitFeedback />
              </ProtectedRoute>
            } 
          />
          
          {/* Doctor routes */}
          <Route 
            path="/doctor/dashboard" 
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/doctor/appointments" 
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorAppointments />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/doctor/profile" 
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorProfileEdit />
              </ProtectedRoute>
            } 
          />
            {/* Admin routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/doctors" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDoctors />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/specializations" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSpecializations />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminReports />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
