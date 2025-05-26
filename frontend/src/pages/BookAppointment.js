import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import { format, addMinutes, parse } from 'date-fns';
import { FaCalendarAlt, FaClock, FaClipboardList } from 'react-icons/fa';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const api = useMemo(() => new ApiService(token), [token]);
  
  // Define fetchAvailableSlots with useCallback before using it
  const fetchAvailableSlots = useCallback(async (date) => {
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const slots = await api.getAvailableSlots(doctorId, formattedDate);
      setAvailableSlots(slots);
    } catch (error) {
      toast.error('Failed to fetch available slots. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [api, doctorId]);
  
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        
        // Fetch doctor details
        const doctorData = await api.getDoctorById(doctorId);
        setDoctor(doctorData);
        
        // Fetch user details
        const userResponse = await fetch(`http://localhost:3001/api/users/${doctorData.userId}`);
        const userData = await userResponse.json();
        setUserData(userData);
        
        // Fetch available slots for today
        fetchAvailableSlots(selectedDate);
      } catch (error) {
        toast.error('Failed to load doctor information. Please try again.');
        console.error(error);
      }
    };
    
    fetchDoctorData();
  }, [doctorId, api, fetchAvailableSlots, selectedDate]);
  
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, fetchAvailableSlots]);
  
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
  };
  
  const handleSlotChange = (slot) => {
    setSelectedSlot(slot);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Calculate end time (30 minutes after start time)
      const startTime = selectedSlot;
      const startDateTime = parse(startTime, 'HH:mm', new Date());
      const endDateTime = addMinutes(startDateTime, 30);
      const endTime = format(endDateTime, 'HH:mm');
      
      const appointmentData = {
        doctorId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        reason
      };
      
      await api.createAppointment(appointmentData);
      toast.success('Appointment booked successfully!');
      navigate('/my-appointments');
    } catch (error) {
      toast.error('Failed to book appointment. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading && !doctor) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Book an Appointment</h1>
      
      {doctor && userData && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Doctor Info Summary */}
          <div className="bg-blue-50 p-6 border-b">
            <h2 className="text-xl font-semibold">Dr. {userData.name}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {doctor.specializations?.map((spec) => (
                <span
                  key={spec._id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {spec.name}
                </span>
              ))}
            </div>
            {doctor.consultationFee !== undefined && (
              <p className="mt-2 text-gray-700">
                Consultation Fee: ${doctor.consultationFee}
              </p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  Select Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  calendarClassName="font-sans"
                />
              </div>
              
              {/* Time Slot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaClock className="mr-2 text-blue-500" />
                  Select Time Slot
                </label>
                
                {loading ? (
                  <div className="flex items-center justify-center h-10">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading available slots...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-md text-gray-500 text-center">
                    No available slots for this date. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`p-2 text-center text-sm rounded-md border ${
                          selectedSlot === slot
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSlotChange(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Reason for Appointment */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaClipboardList className="mr-2 text-blue-500" />
                Reason for Appointment
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please briefly describe your symptoms or reason for the appointment..."
              />
            </div>
            
            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting || !selectedSlot || loading}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
