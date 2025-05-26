import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
  const USER_SERVICE_PORT = process.env.REACT_APP_USER_SERVICE_PORT || '3001';
  
  const userServiceUrl = `${API_BASE_URL}:${USER_SERVICE_PORT}`;
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (token) {
        try {
          const config = {
            headers: {
              'x-auth-token': token
            }
          };
          
          const response = await axios.get(`${userServiceUrl}/api/users/me`, config);
          setUser(response.data);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Adding logout to dependencies could cause a logout loop on errors
  }, [token, userServiceUrl]);
  
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`${userServiceUrl}/api/users/register`, userData);
      const { token: newToken } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Load user profile
      const config = {
        headers: {
          'x-auth-token': newToken
        }
      };
      
      const userResponse = await axios.get(`${userServiceUrl}/api/users/me`, config);
      setUser(userResponse.data);
      
      return { success: true, data: userResponse.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data || err.message };
    }
  };
  
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await axios.post(`${userServiceUrl}/api/users/login`, credentials);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true, data: userData };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, error: err.response?.data || err.message };
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };
  
  const updateProfile = async (userId, userData) => {
    try {
      setError(null);
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const response = await axios.put(`${userServiceUrl}/api/users/${userId}`, userData, config);
      setUser(response.data);
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      return { success: false, error: err.response?.data || err.message };
    }
  };
  
  // Create axios instance with authentication token
  const authAxios = axios.create();
  
  authAxios.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    updateProfile,
    authAxios
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};