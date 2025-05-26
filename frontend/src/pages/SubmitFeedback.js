import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { toast } from 'react-toastify';
import { FaStar } from 'react-icons/fa';
import { format } from 'date-fns';

const SubmitFeedback = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  
  const api = useMemo(() => new ApiService(token), [token]);
  
  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        setLoading(true);
        
        // Fetch appointment details
        const appointmentData = await api.getAppointmentById(appointmentId);
        setAppointment(appointmentData);
        
        // Check if feedback already exists
        try {
          const feedbackData = await api.getFeedbackForAppointment(appointmentId);
          if (feedbackData) {
            setExistingFeedback(feedbackData);
            setRating(feedbackData.rating);
            setComment(feedbackData.comment || '');
          }
        } catch (error) {
          // If 404, no feedback exists yet which is fine
          if (error.response?.status !== 404) {
            console.error('Error fetching feedback:', error);
          }
        }
      } catch (error) {
        toast.error('Failed to load appointment details. Please try again.');
        console.error(error);
        navigate('/my-appointments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointmentData();
  }, [appointmentId, api, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const feedbackData = {
        appointmentId,
        rating,
        comment: comment.trim() || undefined
      };
      
      await api.submitFeedback(feedbackData);
      toast.success('Feedback submitted successfully!');
      navigate('/my-appointments');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!appointment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Appointment not found</h2>
        <p className="mt-2 text-gray-600">The appointment you're looking for does not exist.</p>
        <button
          onClick={() => navigate('/my-appointments')}
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to my appointments
        </button>
      </div>
    );
  }
  
  if (appointment.status !== 'completed') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You can only submit feedback for completed appointments.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/my-appointments')}
          className="text-blue-600 hover:underline"
        >
          Back to my appointments
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {existingFeedback ? 'Your Feedback' : 'Submit Feedback'}
      </h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Appointment Info */}
        <div className="bg-blue-50 p-6 border-b">
          <h2 className="text-xl font-semibold">
            Appointment with Dr. {appointment.doctor?.user?.name || 'Unknown'}
          </h2>
          <p className="text-gray-700 mt-2">
            {format(new Date(appointment.date), 'MMMM dd, yyyy')} at {appointment.startTime}
          </p>
          {appointment.reason && (
            <p className="text-gray-700 mt-1">Reason: {appointment.reason}</p>
          )}
        </div>
        
        <div className="p-6">
          {existingFeedback ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Your Rating</h3>
                <div className="flex">
                  {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                      <FaStar
                        key={index}
                        className={`h-8 w-8 ${
                          starValue <= rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              
              {comment && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Your Comment</h3>
                  <p className="text-gray-700">{comment}</p>
                </div>
              )}
              
              <p className="text-gray-600 italic">
                Feedback submitted on {format(new Date(existingFeedback.createdAt), 'MMMM dd, yyyy')}
              </p>
              
              <div className="mt-8">
                <button
                  onClick={() => navigate('/my-appointments')}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Appointments
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Rate your experience</h3>
                <div className="flex">
                  {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                      <label key={index} className="cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          value={starValue}
                          onClick={() => setRating(starValue)}
                          className="hidden"
                        />
                        <FaStar
                          className={`h-8 w-8 ${
                            starValue <= (hover || rating) 
                              ? 'text-yellow-500' 
                              : 'text-gray-300'
                          }`}
                          onMouseEnter={() => setHover(starValue)}
                          onMouseLeave={() => setHover(0)}
                        />
                      </label>
                    );
                  })}
                </div>
                {rating > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="comment" className="block text-lg font-medium mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Share your experience with the doctor..."
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/my-appointments')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitFeedback;
