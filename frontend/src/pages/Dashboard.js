import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { format } from 'date-fns';
import { FaCalendarAlt, FaUserMd, FaStar } from 'react-icons/fa';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const api = useMemo(() => new ApiService(token), [token]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user) {
          // If user is null, exit early
          return;
        }
        
        // Fetch upcoming appointments
        const appointmentsData = await api.getAppointments('scheduled');
        
        // Sort and filter for upcoming appointments
        const upcoming = appointmentsData
          .filter(appointment => new Date(appointment.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5); // Show only 5 upcoming appointments
        
        setUpcomingAppointments(upcoming);
        
        // Fetch feedback if user is a patient
        if (user.role === 'patient') {
          const feedbackData = await api.getPatientFeedback();
          setRecentFeedback(feedbackData.slice(0, 3)); // Show only 3 recent feedback
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [api, user]);
  
  // Generate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Early return if user is null
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          Loading user data... If this persists, please try logging in again.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{getGreeting()}, {user.name}!</h1>
        <p className="text-gray-600 mt-2">Welcome to your healthcare dashboard</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointments Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" />
              Upcoming Appointments
            </h2>
            <Link 
              to={user.role === 'patient' ? '/my-appointments' : '/doctor/appointments'} 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No upcoming appointments</p>
              {user.role === 'patient' && (
                <Link 
                  to="/search-doctors" 
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                >
                  Book an appointment
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {user.role === 'patient' 
                          ? `Dr. ${appointment.doctor?.user?.name || 'Unknown'}`
                          : appointment.patient?.name || 'Unknown Patient'
                        }
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
        
        {/* Quick Actions for Patients */}
        {user.role === 'patient' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/search-doctors"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 text-center flex flex-col items-center justify-center"
              >
                <FaUserMd className="text-2xl mb-2" />
                <span>Find a Doctor</span>
              </Link>
              
              <Link
                to="/my-appointments"
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 text-center flex flex-col items-center justify-center"
              >
                <FaCalendarAlt className="text-2xl mb-2" />
                <span>My Appointments</span>
              </Link>
            </div>
            
            {/* Recent Feedback Section */}
            {recentFeedback.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FaStar className="mr-2 text-yellow-500" />
                  Your Recent Feedback
                </h3>
                <div className="space-y-3">
                  {recentFeedback.map((feedback) => (
                    <div key={feedback._id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`text-sm ${
                                i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          for Dr. {feedback.doctor?.user?.name || 'Unknown'}
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm mt-1">{feedback.comment}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Stats and Info for Doctors */}
        {user.role === 'doctor' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Practice</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold">
                  {upcomingAppointments.filter(
                    app => new Date(app.date).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/doctor/profile" 
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <span className="mr-2">→</span> Update your profile
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/doctor/appointments" 
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <span className="mr-2">→</span> Manage appointments
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
