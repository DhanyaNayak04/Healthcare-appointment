import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { format } from 'date-fns';
import { FaCalendarAlt, FaUserCheck, FaClock, FaUserMd, FaCalendarCheck, FaStar, FaUsers } from 'react-icons/fa';

const DoctorDashboard = () => {
  const { user, token, loading: authLoading, debugAuth } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const api = useMemo(() => new ApiService(token), [token]);
  
  useEffect(() => {
    // Debug auth when component mounts
    console.log('Current user in DoctorDashboard:', user);
    if (debugAuth) debugAuth();
    
    // Only fetch data if auth is complete and user exists
    if (!authLoading && token && user && user.id) {
      fetchDashboardData();
    } else if (!authLoading && (!token || !user)) {
      navigate('/login');
    }
  }, [authLoading, token, user]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user exists and has an ID
      if (!user || !user.id) {
        console.error('User data incomplete. User:', user);
        setError('User data not available. Please try logging in again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching doctor profile for user ID:', user.id);
      
      // Fetch doctor profile
      try {
        const doctorProfile = await api.getDoctorByUserId(user.id);
        console.log('Doctor profile fetched:', doctorProfile);
        setDoctorProfile(doctorProfile);
      } catch (profileError) {
        console.error('Error fetching doctor profile:', profileError);
        // Continue with other data even if profile fetch fails
      }
      
      // Fetch upcoming appointments with error handling
      try {
        console.log('Fetching scheduled appointments');
        const appointments = await api.getAppointments('scheduled');
        
        // Sort and filter appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = appointments
          .filter(appointment => new Date(appointment.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);
        
        setUpcomingAppointments(upcoming);
        
        // Calculate stats
        const todayAppointments = appointments.filter(
          appointment => 
            new Date(appointment.date).toDateString() === today.toDateString() &&
            appointment.status === 'scheduled'
        );
        
        const upcomingAppointments = appointments.filter(
          appointment => 
            new Date(appointment.date) > today &&
            appointment.status === 'scheduled'
        );
        
        setStats(prevStats => ({
          ...prevStats,
          todayCount: todayAppointments.length,
          upcomingCount: upcomingAppointments.length,
        }));
      } catch (appointmentError) {
        console.error('Error fetching appointments:', appointmentError);
        // Continue with other data even if appointments fetch fails
      }
      
      // Fetch completed and cancelled appointments stats
      try {
        const completedAppointments = await api.getAppointments('completed');
        setStats(prevStats => ({
          ...prevStats,
          completedCount: completedAppointments.length,
        }));
      } catch (error) {
        console.error('Error fetching completed appointments:', error);
      }
      
      try {
        const cancelledAppointments = await api.getAppointments('cancelled');
        setStats(prevStats => ({
          ...prevStats,
          cancelledCount: cancelledAppointments.length,
        }));
      } catch (error) {
        console.error('Error fetching cancelled appointments:', error);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Authenticating...</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Not logged in: </strong>
          <span className="block sm:inline">Please log in to access the doctor dashboard.</span>
          <Link to="/login" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, Dr. {user.name || 'Doctor'}</p>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaCalendarAlt className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Today's Appointments</p>
            <p className="text-2xl font-bold text-gray-800">{stats.todayCount}</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaClock className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-gray-800">{stats.upcomingCount}</p>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <FaUserCheck className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-800">{stats.completedCount}</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg shadow-sm p-6 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FaCalendarAlt className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-gray-800">{stats.cancelledCount}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
            <Link
              to="/doctor/appointments"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          
          <div className="p-6">
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No upcoming appointments</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {appointment.patient?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(appointment.date), 'MMMM dd, yyyy')} at {appointment.startTime}
                        </p>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            Reason: {appointment.reason}
                          </p>
                        )}
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Doctor Profile Summary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Your Profile</h2>
          </div>
          
          <div className="p-6">
            {!doctorProfile ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">You haven't completed your doctor profile yet.</p>
                <Link
                  to="/doctor/profile"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Complete Your Profile
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctorProfile.specializations?.map((spec) => (
                      <span
                        key={spec._id}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Available Hours</h3>
                  {doctorProfile.availableSlots && doctorProfile.availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {doctorProfile.availableSlots
                        .filter(slot => slot.isAvailable)
                        .map((slot, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded">
                            <p className="font-medium">{slot.day}</p>
                            <p className="text-sm text-gray-600">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No available hours set</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <Link
                    to="/doctor/profile"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
