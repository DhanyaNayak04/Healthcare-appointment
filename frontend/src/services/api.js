import axios from 'axios';

// Get API base URLs from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
// Declare userServiceUrl to use it in the API service
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

// Debug function to check if services are reachable
const debugServices = async () => {
  const services = [
    { name: 'User Service', url: `${userServiceUrl}/health` },
    { name: 'Doctor Service', url: `${doctorServiceUrl}/health` },
    { name: 'Appointment Service', url: `${appointmentServiceUrl}/health` },
    { name: 'Feedback Service', url: `${feedbackServiceUrl}/health` },
    { name: 'Notification Service', url: `${notificationServiceUrl}/health` }
  ];
  
  console.log('API Services Configuration:');
  console.log(`API Base URL: ${API_BASE_URL}`);
  services.forEach(service => {
    console.log(`${service.name}: ${service.url}`);
  });
  
  console.log('\nChecking service health:');
  const results = {
    healthy: [],
    unhealthy: []
  };
  
  for (const service of services) {
    try {
      console.log(`Checking ${service.name}...`);
      const response = await axios.get(service.url, { 
        timeout: 3000,
        validateStatus: function (status) {
          // Accept any status code as "response" to better debug issues
          return true;
        }
      });
      
      const statusCode = response.status;
      
      if (statusCode >= 200 && statusCode < 300) {
        console.log(`✅ ${service.name} is reachable (${statusCode})`);
        results.healthy.push(service.name);
      } else {
        console.error(`❌ ${service.name} returned status code ${statusCode}`);
        if (response.data) {
          console.error(`Response data:`, response.data);
        }
        results.unhealthy.push({
          name: service.name,
          status: statusCode,
          data: response.data || null
        });
      }
    } catch (error) {
      const errorMessage = error.code === 'ECONNREFUSED' ? 
        'Connection refused - service may not be running' :
        error.code === 'ECONNABORTED' ? 
          'Connection timed out - service may be slow or unresponsive' : 
          error.message;
      
      console.error(`❌ ${service.name} is NOT reachable: ${errorMessage}`);
      
      results.unhealthy.push({
        name: service.name, 
        error: errorMessage,
        code: error.code
      });
    }
  }
  
  // Summary
  console.log('\nHealth Check Summary:');
  console.log(`✅ Healthy Services (${results.healthy.length}): ${results.healthy.join(', ') || 'None'}`);
  console.log(`❌ Unhealthy Services (${results.unhealthy.length}): ${results.unhealthy.map(s => s.name).join(', ') || 'None'}`);
  
  if (results.unhealthy.length > 0) {
    console.log('\nTroubleshooting Steps:');
    console.log('1. Verify that all services are running (check Docker containers or process list)');
    console.log('2. Confirm that the environment variables for ports are correct');
    console.log('3. Ensure each service has implemented the /health endpoint');
    console.log('4. Check for network issues or firewall restrictions');
  }
  
  return results;
};

// Create axios instance with authentication
const createAuthAxios = (token) => {
  const instance = axios.create();
  
  // Add request logging
  instance.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );
  
  // Add response logging
  instance.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status} from ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error('Response error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// API service with all endpoints
export default class ApiService {
  constructor(token) {
    this.axios = createAuthAxios(token);
    this.debug = debugServices;
  }
  
  // User service methods
  async getUserProfile() {
    try {
      const response = await this.axios.get(`${userServiceUrl}/api/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error.message);
      throw error;
    }
  }
  
  // Doctor service
  async getAllDoctors(specializationId = null, onlyApproved = false) {
    try {
      const params = {};
      
      if (specializationId) {
        params.specialization = specializationId;
      }
      
      if (onlyApproved) {
        params.approved = true;
      }
      
      console.log('Fetching doctors with params:', params);
      const response = await this.axios.get(`${doctorServiceUrl}/api/doctors`, { 
        params,
        timeout: 8000, // Add timeout to prevent hanging requests
        validateStatus: function(status) {
          return status >= 200 && status < 300 || status === 500; // Handle 500 without throwing
        }
      });
      
      // Handle server error with a more graceful approach
      if (response.status === 500) {
        console.error('Server error when fetching doctors:', response.data);
        const errorMessage = response.data && response.data.message 
          ? response.data.message
          : 'Unknown server error occurred';
        
        console.error(`Doctor service error details: ${errorMessage}`);
        
        // Add additional logging to help with diagnosis
        if (response.data && response.data.error) {
          console.error('Error details:', response.data.error);
        }
        
        // Return empty doctors array with error information
        return { 
          doctors: [], 
          error: errorMessage,
          fromCache: false
        };
      }
      
      // Make sure we're always returning { doctors: [...] } format
      return {
        doctors: response.data,
        error: null,
        fromCache: false
      };
    } catch (error) {
      console.error('Error getting all doctors:', error.message);
      
      // Add more detailed error handling
      let errorMessage = 'Failed to fetch doctors';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out - doctor service may be overloaded';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - doctor service may be down';
      } else if (error.response) {
        errorMessage = `Server returned ${error.response.status}: ${error.response.data?.message || error.message}`;
      }
      
      console.error(`Enhanced error details: ${errorMessage}`);
      
      // Return empty array with error info to prevent UI from breaking
      return { 
        doctors: [], 
        error: errorMessage,
        fromCache: false
      };
    }
  }
  
  async getDoctorById(doctorId) {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }
      const response = await this.axios.get(`${doctorServiceUrl}/api/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting doctor by ID (${doctorId}):`, error.message);
      throw error;
    }
  }
  
  async getDoctorByUserId(userId) {
    try {
      if (!userId) {
        console.warn('Warning: Attempting to get doctor profile without a user ID');
        // Return null instead of throwing an error to allow the UI to handle it gracefully
        return null;
      }
      
      console.log(`Fetching doctor profile for user ID: ${userId}`);
      const response = await this.axios.get(`${doctorServiceUrl}/api/doctors/user/${userId}`, {
        // Add timeout to prevent hanging requests
        timeout: 5000,
        // Use validateStatus to handle 404 without throwing an error
        validateStatus: function(status) {
          return status === 200 || status === 404; // Accept 404 to handle it gracefully
        }
      });
      
      // Check if we got a 404 response
      if (response.status === 404) {
        console.log(`No doctor profile exists for user ID ${userId} - returning null`);
        return null;
      }
      
      // Check if response contains an empty default profile
      if (response.data && 
          (!response.data.specializations || response.data.specializations.length === 0) && 
          (!response.data.qualifications || response.data.qualifications.length === 0) &&
          response.data.experience === 0 &&
          !response.data.bio) {
        console.log('Received empty doctor profile - treating as not created yet');
        // This is a placeholder profile, not a real one
        return null;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error getting doctor by user ID (${userId}):`, error.message);
      // If the error is 404, it means the doctor profile doesn't exist yet
      if (error.response && error.response.status === 404) {
        console.log(`No doctor profile exists for user ID ${userId} - returning null`);
        return null;
      }
      // Return null to prevent cascading errors
      return null;
    }
  }
  
  async createDoctorProfile(profileData) {
    try {
      console.log('Creating doctor profile with data:', profileData);
      
      // Ensure userId is present
      if (!profileData.userId) {
        throw new Error('User ID is required to create a doctor profile');
      }
      
      // Make sure specializations is properly formatted as an array of IDs
      if (profileData.specializations && !Array.isArray(profileData.specializations)) {
        console.warn('Specializations is not an array, converting to array format');
        profileData.specializations = [profileData.specializations];
      }
      
      // Ensure all required fields are present and properly formatted
      const sanitizedData = {
        userId: profileData.userId,
        specializations: profileData.specializations || [],
        qualifications: profileData.qualifications && profileData.qualifications.length > 0 
          ? profileData.qualifications.filter(q => q.degree && q.institution && q.year) 
          : [],
        experience: Number(profileData.experience) || 0,
        bio: profileData.bio || '',
        consultationFee: Number(profileData.consultationFee) || 0,
        availableSlots: profileData.availableSlots && profileData.availableSlots.length === 7 
          ? profileData.availableSlots 
          : [
              { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
              { day: 'Sunday', startTime: '09:00', endTime: '13:00', isAvailable: false },
            ]
      };
      
      console.log('Sending sanitized data to API:', sanitizedData);
      const response = await this.axios.post(`${doctorServiceUrl}/api/doctors`, sanitizedData);
      return response.data;
    } catch (error) {
      console.error('Error creating doctor profile:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Check for specific 400 error about doctor profile already existing
        if (error.response.status === 400 && 
            error.response.data && 
            (error.response.data.message?.includes('already exists') || 
             (typeof error.response.data === 'string' && error.response.data.includes('already exists')))) {
          
          const errorMsg = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || 'Doctor profile already exists';
          
          throw new Error(`${error.message}: ${errorMsg}`);
        }
        
        // Enhance error message with server response details if available
        if (error.response.data && error.response.data.message) {
          throw new Error(`${error.message}: ${error.response.data.message}`);
        }
      }
      throw error;
    }
  }
  
  async updateDoctorProfile(doctorId, profileData) {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required to update a doctor profile');
      }
      
      // Ensure all data is properly formatted
      const sanitizedData = {
        specializations: profileData.specializations || [],
        qualifications: profileData.qualifications && profileData.qualifications.length > 0 
          ? profileData.qualifications.filter(q => q.degree && q.institution && q.year) 
          : [],
        experience: Number(profileData.experience) || 0,
        bio: profileData.bio || '',
        consultationFee: Number(profileData.consultationFee) || 0,
        availableSlots: profileData.availableSlots || []
      };
      
      console.log(`Updating doctor profile (ID: ${doctorId}) with data:`, sanitizedData);
      const response = await this.axios.put(`${doctorServiceUrl}/api/doctors/${doctorId}`, sanitizedData);
      return response.data;
    } catch (error) {
      console.error(`Error updating doctor profile (ID: ${doctorId}):`, error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  }
  
  async updateDoctorSlots(doctorId, slots) {
    const response = await this.axios.put(`${doctorServiceUrl}/api/doctors/${doctorId}/slots`, { availableSlots: slots });
    return response.data;
  }
  
  async getAllSpecializations() {
  try {
    const response = await this.axios.get(`${doctorServiceUrl}/api/specializations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching specializations:', error);
    throw error;
  }
}
  
  // Appointment service
  async createAppointment(appointmentData) {
    try {
      const response = await this.axios.post(`${appointmentServiceUrl}/api/appointments`, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error.message);
      throw error;
    }
  }
  
  async getAppointments(status = null) {
    try {
      const params = status ? { status } : {};
      // Add error handling for missing doctor profile
      const response = await this.axios.get(`${appointmentServiceUrl}/api/appointments`, { 
        params,
        // Add a longer timeout for this potentially complex operation
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting appointments (status: ${status}):`, error.message);
      // Return empty array on error to prevent cascading errors
      return [];
    }
  }
  
  async getAppointmentById(appointmentId) {
    try {
      const response = await this.axios.get(`${appointmentServiceUrl}/api/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting appointment by ID (${appointmentId}):`, error.message);
      throw error;
    }
  }
  
  async updateAppointmentStatus(appointmentId, status, notes = '') {
    try {
      const response = await this.axios.put(`${appointmentServiceUrl}/api/appointments/${appointmentId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment status (ID: ${appointmentId}):`, error.message);
      throw error;
    }
  }
  
  async getAvailableSlots(doctorId, date) {
    try {
      const response = await this.axios.get(`${appointmentServiceUrl}/api/appointments/doctor/${doctorId}/available`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting available slots for doctor (ID: ${doctorId}):`, error.message);
      // Return empty array to prevent cascading errors
      return [];
    }
  }
  
  // Feedback service
  async submitFeedback(feedbackData) {
    const response = await this.axios.post(`${feedbackServiceUrl}/api/feedback`, feedbackData);
    return response.data;
  }
  
  async getDoctorFeedback(doctorId) {
    const response = await this.axios.get(`${feedbackServiceUrl}/api/feedback/doctor/${doctorId}`);
    return response.data;
  }
  
  async getPatientFeedback() {
    const response = await this.axios.get(`${feedbackServiceUrl}/api/feedback/patient`);
    return response.data;
  }
  
  async getFeedbackForAppointment(appointmentId) {
    const response = await this.axios.get(`${feedbackServiceUrl}/api/feedback/appointment/${appointmentId}`);
    return response.data;
  }
  
  // Notification service
  async getNotifications(isRead = null) {
    const params = isRead !== null ? { isRead } : {};
    const response = await this.axios.get(`${notificationServiceUrl}/api/notifications`, { params });
    return response.data;
  }
  
  async markNotificationAsRead(notificationId) {
    const response = await this.axios.put(`${notificationServiceUrl}/api/notifications/${notificationId}/read`);
    return response.data;
  }
  
  async markAllNotificationsAsRead() {
    const response = await this.axios.put(`${notificationServiceUrl}/api/notifications/read-all`);
    return response.data;
  }

  // Update doctor approval status
  async updateDoctorApprovalStatus(doctorId, isApproved) {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required to update approval status');
      }
      
      const response = await this.axios.put(`${doctorServiceUrl}/api/doctors/${doctorId}/approve`, { isApproved });
      return response.data;
    } catch (error) {
      console.error(`Error updating doctor approval status (ID: ${doctorId}):`, error.message);
      throw error;
    }
  }
}

// Export the debug function for standalone use
export { debugServices };
