import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { FaEdit, FaEye, FaUserMd, FaCheck, FaTimes } from 'react-icons/fa';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDoctor, setViewDoctor] = useState(null);

  const { token } = useAuth();
  const api = useMemo(() => new ApiService(token), [token]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const doctorsData = await api.getAllDoctors();
      
      // Fetch user details for each doctor
      const doctorsWithUserDetails = await Promise.all(
        doctorsData.map(async (doctor) => {
          try {
            const userResponse = await fetch(`http://localhost:3001/api/users/${doctor.userId}`, {
              headers: { 'x-auth-token': token }
            });
            const userData = await userResponse.json();
            return {
              ...doctor,
              user: userData
            };
          } catch (error) {
            console.error('Error fetching user details:', error);
            return doctor;
          }
        })
      );
      
      setDoctors(doctorsWithUserDetails);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctor = (doctor) => {
    setViewDoctor(doctor);
  };

  const handleApproveDoctor = async (doctorId, approved) => {
    try {
      // Call the doctor approval endpoint
      await api.updateDoctorApprovalStatus(doctorId, approved);
      toast.success(`Doctor ${approved ? 'approved' : 'rejected'} successfully`);
      fetchDoctors(); // Refresh the list
    } catch (error) {
      console.error('Error updating doctor status:', error);
      toast.error('Failed to update doctor status');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Doctors</h1>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specializations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map(doctor => (
                <tr key={doctor._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.user?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {doctor.specializations?.map(spec => (
                        <span key={spec._id} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          {spec.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.experience} years
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doctor.isApproved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doctor.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleViewDoctor(doctor)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View doctor details"
                    >
                      <FaEye />
                    </button>
                    <button 
                      onClick={() => handleApproveDoctor(doctor._id, true)}
                      className={`text-green-600 hover:text-green-900 mr-3 ${doctor.isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={doctor.isApproved}
                      title="Approve doctor"
                    >
                      <FaCheck />
                    </button>
                    <button 
                      onClick={() => handleApproveDoctor(doctor._id, false)}
                      className={`text-red-600 hover:text-red-900 ${!doctor.isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!doctor.isApproved}
                      title="Reject doctor"
                    >
                      <FaTimes />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Doctor Modal would go here */}
    </div>
  );
};

export default AdminDoctors;
