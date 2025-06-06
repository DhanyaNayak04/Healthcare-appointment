import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { toast } from 'react-toastify';

const SearchDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { token } = useAuth();
  const api = useMemo(() => new ApiService(token), [token]);
  
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch specializations
      const specializationsData = await api.getAllSpecializations();
      setSpecializations(specializationsData || []);
      
      // Fetch only approved doctors
      const response = await api.getAllDoctors(selectedSpecialization || null, true);
      
      // Check if there was an error
      if (response.error) {
        setError(response.error);
        toast.error(`Failed to load doctors: ${response.error}`);
        setDoctors([]);
        return;
      }
      
      // Use the doctors array from the response
      const doctorsData = response.doctors || [];
      
      if (doctorsData.length === 0) {
        console.log('No doctors found or empty array returned');
      }
      
      // Fetch user details for each doctor
      const doctorsWithUserDetails = await Promise.all(
        doctorsData.map(async (doctor) => {
          try {
            if (!doctor || !doctor.userId) {
              console.warn('Doctor object is invalid:', doctor);
              return { ...doctor, user: { name: 'Unknown' } };
            }
            
            const userResponse = await fetch(`http://localhost:3001/api/users/${doctor.userId}`, {
              headers: { 'x-auth-token': token }
            });
            
            if (!userResponse.ok) {
              console.warn(`Failed to fetch user details for doctor ${doctor._id}`);
              return { ...doctor, user: { name: 'Unknown' } };
            }
            
            const userData = await userResponse.json();
            return {
              ...doctor,
              user: userData
            };
          } catch (error) {
            console.error('Error fetching user details:', error);
            return { ...doctor, user: { name: 'Unknown' } };
          }
        })
      );
      
      setDoctors(doctorsWithUserDetails);
    } catch (error) {
      setError('Failed to load doctors. Please try again.');
      toast.error('Failed to load doctors. Please try again.');
      console.error(error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [api, token, selectedSpecialization]);
  
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);
  
  const handleSpecializationChange = async (e) => {
    const specializationId = e.target.value;
    setSelectedSpecialization(specializationId);
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getAllDoctors(specializationId || null, true);
      
      // Check if there was an error
      if (response.error) {
        setError(response.error);
        toast.error(`Failed to load doctors: ${response.error}`);
        setDoctors([]);
        return;
      }
      
      // Use the doctors array from the response
      const doctorsData = response.doctors || [];
      
      // Fetch user details for each doctor
      const doctorsWithUserDetails = await Promise.all(
        doctorsData.map(async (doctor) => {
          try {
            if (!doctor || !doctor.userId) {
              return { ...doctor, user: { name: 'Unknown' } };
            }
            
            const userResponse = await fetch(`http://localhost:3001/api/users/${doctor.userId}`, {
              headers: { 'x-auth-token': token }
            });
            
            if (!userResponse.ok) {
              return { ...doctor, user: { name: 'Unknown' } };
            }
            
            const userData = await userResponse.json();
            return {
              ...doctor,
              user: userData
            };
          } catch (error) {
            console.error('Error fetching user details:', error);
            return { ...doctor, user: { name: 'Unknown' } };
          }
        })
      );
      
      setDoctors(doctorsWithUserDetails);
    } catch (error) {
      setError('Failed to filter doctors. Please try again.');
      toast.error('Failed to filter doctors. Please try again.');
      console.error(error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const filteredDoctors = doctors.filter((doctor) => {
    if (!doctor || !doctor.user) return false;
    
    return (
      doctor.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.bio && doctor.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find a Doctor</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Specialization
            </label>
            <select
              id="specialization"
              value={selectedSpecialization}
              onChange={handleSpecializationChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              {specializations.map((specialization) => (
                <option key={specialization._id} value={specialization._id}>
                  {specialization.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search by Name or Keywords
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search doctors..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">Loading doctors...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDoctors}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No doctors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{doctor.user?.name || 'Unknown'}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {doctor.specializations?.map((spec) => (
                    <span key={spec._id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {spec.name}
                    </span>
                  ))}
                </div>
                
                {doctor.qualifications && doctor.qualifications.length > 0 && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Qualifications:</span>{' '}
                    {doctor.qualifications.map(q => `${q.degree} (${q.institution})`).join(', ')}
                  </p>
                )}
                
                {doctor.experience !== undefined && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Experience:</span> {doctor.experience} years
                  </p>
                )}
                
                {doctor.consultationFee !== undefined && (
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium">Consultation Fee:</span> ${doctor.consultationFee}
                  </p>
                )}
                
                <div className="mt-4 flex space-x-2">
                  <Link 
                    to={`/doctors/${doctor._id}`} 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Profile
                  </Link>
                  <Link 
                    to={`/book-appointment/${doctor._id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchDoctors;
