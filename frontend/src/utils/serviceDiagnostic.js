import axios from 'axios';

/**
 * Service Diagnostic Utility
 * 
 * This utility helps to diagnose issues with backend microservices
 * by checking their health endpoints and verifying configuration.
 */

// Get API base URLs from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
const USER_SERVICE_PORT = process.env.REACT_APP_USER_SERVICE_PORT || '3001';
const DOCTOR_SERVICE_PORT = process.env.REACT_APP_DOCTOR_SERVICE_PORT || '3002';
const APPOINTMENT_SERVICE_PORT = process.env.REACT_APP_APPOINTMENT_SERVICE_PORT || '3003';
const FEEDBACK_SERVICE_PORT = process.env.REACT_APP_FEEDBACK_SERVICE_PORT || '3004';
const NOTIFICATION_SERVICE_PORT = process.env.REACT_APP_NOTIFICATION_SERVICE_PORT || '3005';

// Service URLs
const userServiceUrl = `${API_BASE_URL}:${USER_SERVICE_PORT}`;
const doctorServiceUrl = `${API_BASE_URL}:${DOCTOR_SERVICE_PORT}`;
const appointmentServiceUrl = `${API_BASE_URL}:${APPOINTMENT_SERVICE_PORT}`;
const feedbackServiceUrl = `${API_BASE_URL}:${FEEDBACK_SERVICE_PORT}`;
const notificationServiceUrl = `${API_BASE_URL}:${NOTIFICATION_SERVICE_PORT}`;

/**
 * Check if a service is running by calling its health endpoint
 * @param {string} serviceUrl - The base URL of the service
 * @param {string} serviceName - The name of the service for logging
 * @returns {Promise<{success: boolean, message: string}>} - Result of the health check
 */
export const checkServiceHealth = async (serviceUrl, serviceName) => {
  try {
    const response = await axios.get(`${serviceUrl}/health`, { timeout: 3000 });
    return {
      success: true,
      message: `${serviceName} is running: ${JSON.stringify(response.data)}`,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `${serviceName} health check failed: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Run diagnostics on all backend services
 * @returns {Promise<Array>} - Array of diagnostic results
 */
export const runFullDiagnostics = async () => {
  console.log('Starting full service diagnostics...');
  console.log('Environment configuration:');
  console.log(`API_BASE_URL: ${API_BASE_URL}`);
  
  const services = [
    { name: 'User Service', url: userServiceUrl, port: USER_SERVICE_PORT },
    { name: 'Doctor Service', url: doctorServiceUrl, port: DOCTOR_SERVICE_PORT },
    { name: 'Appointment Service', url: appointmentServiceUrl, port: APPOINTMENT_SERVICE_PORT },
    { name: 'Feedback Service', url: feedbackServiceUrl, port: FEEDBACK_SERVICE_PORT },
    { name: 'Notification Service', url: notificationServiceUrl, port: NOTIFICATION_SERVICE_PORT }
  ];
  
  // Log configuration
  services.forEach(service => {
    console.log(`${service.name}: ${service.url} (Port: ${service.port})`);
  });
  
  // Check services
  const results = await Promise.all(
    services.map(async (service) => {
      const result = await checkServiceHealth(service.url, service.name);
      return {
        service: service.name,
        url: service.url,
        ...result
      };
    })
  );
  
  // Log summary
  console.log('\nDiagnostic Results:');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.service}: OK`);
    } else {
      console.error(`❌ ${result.service}: FAILED - ${result.error}`);
    }
  });
  
  return results;
};

/**
 * Check user authentication endpoint
 * @param {string} token - JWT token to test
 * @returns {Promise<Object>} - Result of the test
 */
export const testUserAuthentication = async (token) => {
  if (!token) {
    return {
      success: false,
      message: 'No token provided for authentication test'
    };
  }
  
  try {
    console.log('Testing user authentication with token');
    const response = await axios.get(`${userServiceUrl}/api/users/me`, {
      headers: {
        'x-auth-token': token
      },
      timeout: 3000
    });
    
    return {
      success: true,
      message: 'Authentication successful',
      user: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `Authentication test failed: ${error.message}`,
      error: error.message,
      response: error.response?.data
    };
  }
};

export default {
  checkServiceHealth,
  runFullDiagnostics,
  testUserAuthentication,
  serviceUrls: {
    userServiceUrl,
    doctorServiceUrl,
    appointmentServiceUrl,
    feedbackServiceUrl,
    notificationServiceUrl
  }
};
