import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { toast } from 'react-toastify';

const DoctorProfile = () => {
  const { user, token, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  
  // Form states
  const [userFormData, setUserFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });
  
  const [doctorFormData, setDoctorFormData] = useState({
    specializations: [],
    qualifications: [{ degree: '', institution: '', year: '' }],
    experience: 0,
    bio: '',
    consultationFee: 0,
    availableSlots: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
      { day: 'Sunday', startTime: '09:00', endTime: '13:00', isAvailable: false },
    ],
  });
  
  const api = useMemo(() => new ApiService(token), [token]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Debug current user
        console.log('Current user in DoctorProfile:', user);
        
        // Fetch all specializations
        const specializationsData = await api.getAllSpecializations();
        setSpecializations(specializationsData || []);
        
        // Fetch user profile - add checks for user existence
        if (user && user.id) {
          console.log('Fetching data for user ID:', user.id);
          
          setUserFormData({
            name: user.name || '',
            phone: user.phone || '',
            address: user.address || '',
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          });
          
          // Fetch doctor profile
          try {
            const doctorData = await api.getDoctorByUserId(user.id);
            console.log('Doctor profile data:', doctorData);
            
            if (doctorData) {
              setDoctorProfile(doctorData);
              
              setDoctorFormData({
                specializations: doctorData.specializations ? doctorData.specializations.map(spec => spec._id) : [],
                qualifications: doctorData.qualifications && doctorData.qualifications.length > 0 
                  ? doctorData.qualifications 
                  : [{ degree: '', institution: '', year: '' }],
                experience: doctorData.experience || 0,
                bio: doctorData.bio || '',
                consultationFee: doctorData.consultationFee || 0,
                availableSlots: doctorData.availableSlots && doctorData.availableSlots.length > 0
                  ? doctorData.availableSlots
                  : [
                      { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                      { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                      { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                      { day: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
                      { day: 'Sunday', startTime: '09:00', endTime: '13:00', isAvailable: false },
                    ],
              });
            }
          } catch (error) {
            console.error('Error fetching doctor profile:', error);
            toast.error('Failed to load doctor profile data');
          }
        } else {
          // Handle case when user is not defined or doesn't have an ID
          console.error('User information is missing', { user });
          toast.error('User information is missing. Please log in again.');
          navigate('/login'); // Redirect to login page
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, api, navigate]);
  
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDoctorChange = (e) => {
    const { name, value } = e.target;
    setDoctorFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSpecializationChange = (e) => {
    // Fix for multiple select option handling
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      option => option.value
    );
    
    setDoctorFormData(prev => ({ 
      ...prev, 
      specializations: selectedOptions 
    }));
  };
  
  const handleQualificationChange = (index, field, value) => {
    const updatedQualifications = [...doctorFormData.qualifications];
    updatedQualifications[index][field] = value;
    setDoctorFormData(prev => ({ ...prev, qualifications: updatedQualifications }));
  };
  
  const addQualification = () => {
    setDoctorFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: '', institution: '', year: '' }]
    }));
  };
  
  const removeQualification = (index) => {
    const updatedQualifications = [...doctorFormData.qualifications];
    updatedQualifications.splice(index, 1);
    setDoctorFormData(prev => ({ ...prev, qualifications: updatedQualifications }));
  };
  
  const handleSlotChange = (day, field, value) => {
    const updatedSlots = doctorFormData.availableSlots.map(slot => {
      if (slot.day === day) {
        return { ...slot, [field]: value };
      }
      return slot;
    });
    
    setDoctorFormData(prev => ({ ...prev, availableSlots: updatedSlots }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Add validation to ensure user exists
      if (!user || !user.id) {
        toast.error('User information is missing. Please log in again.');
        setSubmitting(false);
        navigate('/login');
        return;
      }
      
      console.log('Submitting profile update for user:', user.id);
      
      // Update user profile
      const userResult = await updateProfile(user.id, userFormData);
      
      if (!userResult.success) {
        toast.error('Failed to update user profile');
        setSubmitting(false);
        return;
      }
      
      // Validate specializations before submission
      if (!doctorFormData.specializations || doctorFormData.specializations.length === 0) {
        toast.error('Please select at least one specialization');
        setSubmitting(false);
        return;
      }
      
      // Validate qualifications
      const validQualifications = doctorFormData.qualifications.filter(
        q => q.degree && q.institution && q.year
      );
      
      if (validQualifications.length === 0) {
        toast.error('Please add at least one qualification with all fields filled');
        setSubmitting(false);
        return;
      }
      
      // Create standardized profile data
      const profileData = {
        userId: user.id,
        specializations: doctorFormData.specializations,
        qualifications: validQualifications,
        experience: parseInt(doctorFormData.experience) || 0,
        bio: doctorFormData.bio || '',
        consultationFee: parseFloat(doctorFormData.consultationFee) || 0,
        availableSlots: doctorFormData.availableSlots.map(slot => ({
          day: slot.day,
          startTime: slot.startTime || '09:00',
          endTime: slot.endTime || '17:00',
          isAvailable: Boolean(slot.isAvailable)
        })),
      };
      
      try {
        // Check if doctor profile exists before creating/updating
        if (doctorProfile && doctorProfile._id) {
          console.log('Updating existing doctor profile:', doctorProfile._id);
          // Update existing profile
          await api.updateDoctorProfile(doctorProfile._id, profileData);
          toast.success('Doctor profile updated successfully');
        } else {
          console.log('Creating new doctor profile for user:', user.id);
          // Try to create new profile, with better error handling
          await api.createDoctorProfile(profileData);
          toast.success('Doctor profile created successfully');
        }
        
        // Refresh doctor profile data to ensure we have the latest
        const updatedDoctorData = await api.getDoctorByUserId(user.id);
        setDoctorProfile(updatedDoctorData);
        
        // Redirect after successful creation/update
        navigate('/doctor/dashboard');
      } catch (error) {
        console.error('Doctor profile operation error:', error);
        
        // Handle specific error for existing profile
        if (error.message && error.message.includes("Doctor profile already exists")) {
          toast.warning('A profile for this doctor already exists. Refreshing data...');
          
          // Try to fetch the existing profile
          try {
            const existingProfile = await api.getDoctorByUserId(user.id);
            if (existingProfile && existingProfile._id) {
              setDoctorProfile(existingProfile);
              // Now try to update instead of create
              await api.updateDoctorProfile(existingProfile._id, profileData);
              toast.success('Doctor profile updated successfully');
              navigate('/doctor/dashboard');
            }
          } catch (fetchError) {
            console.error('Error fetching existing profile:', fetchError);
            toast.error('Could not retrieve existing doctor profile. Please try again later.');
          }
        } else {
          throw error; // Rethrow to be caught by the outer catch
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      toast.error('Failed to update doctor profile: ' + errorMessage);
      console.error('Profile update error:', error);
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Doctor Profile</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Personal Information */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={userFormData.name}
                onChange={handleUserChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={userFormData.phone}
                onChange={handleUserChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={userFormData.address}
                onChange={handleUserChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={userFormData.dateOfBirth}
                onChange={handleUserChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Professional Information */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specializations</label>
              <select
                multiple
                name="specializations"
                value={doctorFormData.specializations}
                onChange={handleSpecializationChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md h-32"
              >
                {specializations.map(spec => (
                  <option key={spec._id} value={spec._id}>
                    {spec.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              <input
                type="number"
                name="experience"
                value={doctorFormData.experience}
                onChange={handleDoctorChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={doctorFormData.bio}
                onChange={handleDoctorChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Share your professional background, expertise, and approach to patient care..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
              <input
                type="number"
                name="consultationFee"
                value={doctorFormData.consultationFee}
                onChange={handleDoctorChange}
                min="0"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Qualifications */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Qualifications</label>
              <button
                type="button"
                onClick={addQualification}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Qualification
              </button>
            </div>
            
            {doctorFormData.qualifications.map((qual, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 border rounded-lg bg-gray-50">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={qual.degree}
                    onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={qual.institution}
                    onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      value={qual.year}
                      onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {doctorFormData.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="ml-2 text-red-600 hover:text-red-800 p-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Available Hours */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Available Hours</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctorFormData.availableSlots.map((slot, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{slot.day}</h3>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={slot.isAvailable}
                      onChange={(e) => handleSlotChange(slot.day, 'isAvailable', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(slot.day, 'startTime', e.target.value)}
                      disabled={!slot.isAvailable}
                      className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(slot.day, 'endTime', e.target.value)}
                      disabled={!slot.isAvailable}
                      className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="p-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfile;
