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

// Create axios instance with authentication
const createAuthAxios = (token) => {
  const instance = axios.create();
  
  instance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return instance;
};

// API service with all endpoints
export default class ApiService {
  constructor(token) {
    this.axios = createAuthAxios(token);
  }
  
  // User service methods
  async getUserProfile() {
    const response = await this.axios.get(`${userServiceUrl}/api/users/profile`);
    return response.data;
  }
  
  // Doctor service
  async getAllDoctors(specializationId = null) {
    const params = specializationId ? { specialization: specializationId } : {};
    const response = await this.axios.get(`${doctorServiceUrl}/api/doctors`, { params });
    return response.data;
  }
  
  async getDoctorById(doctorId) {
    const response = await this.axios.get(`${doctorServiceUrl}/api/doctors/${doctorId}`);
    return response.data;
  }
  
  async getDoctorByUserId(userId) {
    const response = await this.axios.get(`${doctorServiceUrl}/api/doctors/user/${userId}`);
    return response.data;
  }
  
  async updateDoctorProfile(doctorId, profileData) {
    const response = await this.axios.put(`${doctorServiceUrl}/api/doctors/${doctorId}`, profileData);
    return response.data;
  }
  
  async updateDoctorSlots(doctorId, slots) {
    const response = await this.axios.put(`${doctorServiceUrl}/api/doctors/${doctorId}/slots`, { availableSlots: slots });
    return response.data;
  }
  
  async getAllSpecializations() {
    const response = await this.axios.get(`${doctorServiceUrl}/api/specializations`);
    return response.data;
  }
  
  // Appointment service
  async createAppointment(appointmentData) {
    const response = await this.axios.post(`${appointmentServiceUrl}/api/appointments`, appointmentData);
    return response.data;
  }
  
  async getAppointments(status = null) {
    const params = status ? { status } : {};
    const response = await this.axios.get(`${appointmentServiceUrl}/api/appointments`, { params });
    return response.data;
  }
  
  async getAppointmentById(appointmentId) {
    const response = await this.axios.get(`${appointmentServiceUrl}/api/appointments/${appointmentId}`);
    return response.data;
  }
  
  async updateAppointmentStatus(appointmentId, status, notes = '') {
    const response = await this.axios.put(`${appointmentServiceUrl}/api/appointments/${appointmentId}/status`, { status, notes });
    return response.data;
  }
  
  async getAvailableSlots(doctorId, date) {
    const response = await this.axios.get(`${appointmentServiceUrl}/api/appointments/doctor/${doctorId}/available`, {
      params: { date }
    });
    return response.data;
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
}
