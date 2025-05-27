import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Create the context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (token) {
          // Get user profile with token
          const response = await axios.get('http://localhost:3001/api/users/me', {
            headers: {
              'x-auth-token': token
            }
          });
          
          // Ensure we store the complete user object, including id
          const userData = response.data;
          console.log('User data from auth check:', userData);
          
          // Make sure user has an id field (might be _id in response)
          if (userData._id && !userData.id) {
            userData.id = userData._id;
          }
          
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // If token is invalid, remove it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      // Update endpoint from /api/auth/login to /api/users/login
      const response = await axios.post('http://localhost:3001/api/users/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      // Log the user data to verify it contains all necessary fields
      console.log('User data from login:', userData);
      
      // Make sure user has an id field (might be _id in response)
      if (userData._id && !userData.id) {
        userData.id = userData._id;
      }
      
      // Save token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      // Update endpoint from /api/auth/register to /api/users/register
      const response = await axios.post('http://localhost:3001/api/users/register', userData);
      
      // Auto login after registration if token is provided
      if (response.data.token) {
        const { token: newToken } = response.data;
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        // Load user profile after registration
        try {
          const userResponse = await axios.get('http://localhost:3001/api/users/me', {
            headers: {
              'x-auth-token': newToken
            }
          });
          
          setUser(userResponse.data);
          setIsAuthenticated(true);
          
          return { success: true, data: userResponse.data };
        } catch (profileErr) {
          console.error('Failed to load user profile after registration:', profileErr);
        }
      }
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userId, userData) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/users/${userId}`, userData, {
        headers: {
          'x-auth-token': token
        }
      });
      
      setUser(prev => ({...prev, ...response.data}));
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Update failed';
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    }
  };

  // Debug auth
  const debugAuth = () => {
    console.log('Auth Debug:');
    console.log('- Token exists:', !!token);
    console.log('- isAuthenticated:', isAuthenticated);
    console.log('- User:', user);
  };

  // Context value
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    debugAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
