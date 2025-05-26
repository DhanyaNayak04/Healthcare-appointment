import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  
  const { token } = useAuth();
  const api = useMemo(() => new ApiService(token), [token]);
  
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const appointmentsData = await api.getAppointments();
      setAppointments(appointmentsData);
    } catch (error) {
      toast.error('Failed to load appointments. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      await api.updateAppointmentStatus(appointmentId, 'cancelled');
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment. Please try again.');
      console.error(error);
    }
  };
  
  const filterAppointments = () => {
    if (activeTab === 'upcoming') {
      return appointments.filter(
        (appointment) => 
          appointment.status === 'scheduled' && 
          new Date(appointment.date) >= new Date()
      );
    } else if (activeTab === 'past') {
      return appointments.filter(
        (appointment) => 
          appointment.status === 'completed' || 
          new Date(appointment.date) < new Date()
      );
    } else if (activeTab === 'cancelled') {
      return appointments.filter(
        (appointment) => appointment.status === 'cancelled'
      );
    }
    return appointments;
  };
  
  const filteredAppointments = filterAppointments();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'cancelled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cancelled
            </button>
          </nav>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="spinner"></div>
              <p className="mt-2 text-gray-600">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No {activeTab} appointments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {appointment.doctor?.user?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.doctor?.specializations?.map(s => s.name).join(', ') || 'Specialization not available'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(appointment.date), 'MMMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800' 
                            : appointment.status === 'completed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {appointment.status === 'scheduled' && new Date(appointment.date) > new Date() && (
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="text-red-600 hover:text-red-900 mr-4"
                          >
                            Cancel
                          </button>
                        )}
                        
                        {appointment.status === 'completed' && (
                          <Link 
                            to={`/submit-feedback/${appointment._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Submit Feedback
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
