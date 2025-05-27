import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const AdminSpecializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const { token } = useAuth();
  const api = useMemo(() => new ApiService(token), [token]);

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    try {
      setLoading(true);
      const specsData = await api.getAllSpecializations();
      setSpecializations(specsData);
    } catch (error) {
      console.error('Error fetching specializations:', error);
      toast.error('Failed to load specializations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingSpec(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEditClick = (spec) => {
    setEditingSpec(spec);
    setFormData({ 
      name: spec.name, 
      description: spec.description || '' 
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSpec) {
        // Update existing specialization
        await fetch(`http://localhost:3002/api/specializations/${editingSpec._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        toast.success('Specialization updated successfully');
      } else {
        // Create new specialization
        await fetch('http://localhost:3002/api/specializations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        toast.success('Specialization added successfully');
      }
      
      setShowModal(false);
      fetchSpecializations(); // Refresh the list
    } catch (error) {
      console.error('Error saving specialization:', error);
      toast.error('Failed to save specialization');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this specialization?')) {
      try {
        await fetch(`http://localhost:3002/api/specializations/${id}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': token
          }
        });
        
        toast.success('Specialization deleted successfully');
        fetchSpecializations(); // Refresh the list
      } catch (error) {
        console.error('Error deleting specialization:', error);
        toast.error('Failed to delete specialization');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Specializations</h1>
        <button 
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Specialization
        </button>
      </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specializations.map(spec => (
                <tr key={spec._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{spec.name}</td>
                  <td className="px-6 py-4">{spec.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleEditClick(spec)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDelete(spec._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit Specialization */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingSpec ? 'Edit Specialization' : 'Add New Specialization'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpecializations;
