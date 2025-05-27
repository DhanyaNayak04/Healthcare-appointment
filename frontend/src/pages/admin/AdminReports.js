import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import { FaFileAlt, FaDownload, FaChartBar } from 'react-icons/fa';

const AdminReports = () => {
  const { token } = useAuth();
  const api = useMemo(() => new ApiService(token), [token]);
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <FaFileAlt className="text-blue-500 text-4xl mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Activity Report</h2>
          <p className="text-gray-600 text-center mb-4">View user registration and login statistics</p>
          <button className="mt-auto bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 rounded-md flex items-center">
            <FaDownload className="mr-2" />
            Generate Report
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <FaChartBar className="text-green-500 text-4xl mb-4" />
          <h2 className="text-xl font-semibold mb-2">Appointment Analytics</h2>
          <p className="text-gray-600 text-center mb-4">View appointment trends and statistics</p>
          <button className="mt-auto bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 rounded-md flex items-center">
            <FaDownload className="mr-2" />
            Generate Report
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <FaFileAlt className="text-purple-500 text-4xl mb-4" />
          <h2 className="text-xl font-semibold mb-2">Doctor Performance</h2>
          <p className="text-gray-600 text-center mb-4">View doctor ratings and patient feedback</p>
          <button className="mt-auto bg-purple-100 text-purple-800 hover:bg-purple-200 px-4 py-2 rounded-md flex items-center">
            <FaDownload className="mr-2" />
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Report</h2>
        <p className="text-gray-600 mb-6">
          Select parameters below to generate a custom report for your specific needs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option>User Statistics</option>
              <option>Appointment Statistics</option>
              <option>Doctor Statistics</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last year</option>
              <option>Custom range</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option>PDF</option>
              <option>CSV</option>
              <option>Excel</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            Generate Custom Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
