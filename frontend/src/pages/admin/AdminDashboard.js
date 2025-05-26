import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { FaUserMd, FaUsers, FaCalendarCheck, FaStar, FaClipboardList } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const api = useMemo(() => new ApiService(token), [token]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch users for counting
        const usersResponse = await fetch('http://localhost:3001/api/users', {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          const doctors = users.filter(user => user.role === 'doctor');
          const patients = users.filter(user => user.role === 'patient');
          
          // Fetch appointments
          const appointments = await api.getAppointments();
          
          setStats({
            totalDoctors: doctors.length,
            totalPatients: patients.length,
            totalAppointments: appointments.length,
            pendingApprovals: 0, // Example placeholder, implement actual logic if needed
          });
        }
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [api, token]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome, {user.name}</p>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaUserMd className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Doctors</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalDoctors}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaUsers className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Patients</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPatients}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <FaCalendarCheck className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Appointments</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalAppointments}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <FaClipboardList className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="block p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <FaUsers className="text-blue-500 mr-3" />
              <div>
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-sm text-gray-500">Add, edit, or deactivate user accounts</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/admin/specializations"
            className="block p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <FaUserMd className="text-green-500 mr-3" />
              <div>
                <h3 className="font-medium">Manage Specializations</h3>
                <p className="text-sm text-gray-500">Add or edit medical specializations</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/admin/reports"
            className="block p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <FaStar className="text-purple-500 mr-3" />
              <div>
                <h3 className="font-medium">View Reports</h3>
                <p className="text-sm text-gray-500">Access system statistics and reports</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        
        <p className="text-gray-600 text-center py-6">
          Detailed activity logs would be displayed here.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
