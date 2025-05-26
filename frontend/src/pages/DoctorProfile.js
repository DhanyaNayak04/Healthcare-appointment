import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { FaStar, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUserMd } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DoctorProfile = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [userData, setUserData] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const api = useMemo(() => new ApiService(token), [token]);
  
  const fetchDoctorData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch doctor details
      const doctorData = await api.getDoctorById(id);
      setDoctor(doctorData);
      
      // Fetch user details
      const userResponse = await fetch(`http://localhost:3001/api/users/${doctorData.userId}`);
      const userData = await userResponse.json();
      setUserData(userData);
      
      // Fetch doctor feedback
      const feedbackData = await api.getDoctorFeedback(id);
      setFeedback(feedbackData);
      
      // Fetch feedback stats
      const statsData = await fetch(`http://localhost:3004/api/feedback/stats/doctor/${id}`);
      const statsJson = await statsData.json();
      setStats(statsJson);
      
    } catch (error) {
      toast.error('Failed to load doctor profile. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [api, id]);
  
  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!doctor || !userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Doctor not found</h2>
        <p className="mt-2 text-gray-600">The doctor profile you're looking for does not exist.</p>
        <Link to="/search-doctors" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to doctor search
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Doctor Header */}
        <div className="md:flex">
          <div className="md:flex-shrink-0 p-6 md:p-8 bg-blue-50">
            <div className="h-48 w-48 rounded-full bg-blue-100 mx-auto flex items-center justify-center">
              {userData.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt={userData.name}
                  className="h-48 w-48 rounded-full object-cover"
                />
              ) : (
                <FaUserMd className="h-24 w-24 text-blue-300" />
              )}
            </div>
            
            {stats && (
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(stats.averageRating)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    ({stats.averageRating.toFixed(1)})
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on {stats.totalFeedback} reviews
                </p>
              </div>
            )}
          </div>
          
          <div className="p-6 md:p-8 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Dr. {userData.name}</h1>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {doctor.specializations?.map((spec) => (
                <span
                  key={spec._id}
                  className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {spec.name}
                </span>
              ))}
            </div>
            
            <p className="mt-4 text-gray-700">{doctor.bio}</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Qualifications</h3>
                <ul className="mt-2 space-y-1">
                  {doctor.qualifications?.map((qual, index) => (
                    <li key={index} className="text-gray-700">
                      {qual.degree} - {qual.institution} ({qual.year})
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Details</h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaMapMarkerAlt className="mr-2 text-blue-500" />
                    {userData.address || 'Address not provided'}
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaPhone className="mr-2 text-blue-500" />
                    {userData.phone || 'Phone not provided'}
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaEnvelope className="mr-2 text-blue-500" />
                    {userData.email}
                  </li>
                  {doctor.experience !== undefined && (
                    <li className="flex items-center text-gray-700">
                      <FaUserMd className="mr-2 text-blue-500" />
                      {doctor.experience} years of experience
                    </li>
                  )}
                  {doctor.consultationFee !== undefined && (
                    <li className="font-semibold text-blue-700">
                      Consultation Fee: ${doctor.consultationFee}
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="mt-8">
              <Link
                to={`/book-appointment/${doctor._id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaCalendarAlt className="mr-2" />
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
        
        {/* Doctor Available Hours */}
        {doctor.availableSlots && doctor.availableSlots.length > 0 && (
          <div className="border-t border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-4">Available Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const daySlot = doctor.availableSlots.find(slot => slot.day === day);
                return (
                  <div key={day} className="border rounded-lg p-3">
                    <h3 className="font-semibold text-gray-800">{day}</h3>
                    {daySlot && daySlot.isAvailable ? (
                      <p className="text-sm mt-1">
                        {daySlot.startTime} - {daySlot.endTime}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Not Available</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Patient Feedback */}
        <div className="border-t border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Patient Feedback</h2>
          
          {feedback.length === 0 ? (
            <p className="text-gray-600">No feedback available for this doctor yet.</p>
          ) : (
            <div className="space-y-6">
              {feedback.map((review) => (
                <div key={review._id} className="border-b pb-6 last:border-0">
                  <div className="flex items-center mb-2">
                    <div className="flex mr-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">
                      {review.patient?.name || 'Anonymous Patient'}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
