# Smart Healthcare Appointment System

A microservices-based application for managing healthcare appointments.

## System Architecture

This project uses a microservices architecture with the following components:

- **User Service**: Manages user accounts, authentication, and authorization
- **Doctor Service**: Manages doctor profiles, specializations, and available slots
- **Appointment Service**: Handles appointment booking, viewing, and cancellation
- **Feedback Service**: Collects and retrieves patient feedback for appointments
- **Notification Service**: Sends notifications for appointment updates
- **Frontend**: React-based user interface

## Prerequisites

- Docker and Docker Compose
- Node.js and npm (for local development)

## Setup and Running

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key

# Email Settings
EMAIL_SERVICE=smtp
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# MongoDB URIs
MONGODB_URI_USER=mongodb://user-db:27017/userdb
MONGODB_URI_DOCTOR=mongodb://doctor-db:27017/doctordb
MONGODB_URI_APPOINTMENT=mongodb://appointment-db:27017/appointmentdb
MONGODB_URI_FEEDBACK=mongodb://feedback-db:27017/feedbackdb
MONGODB_URI_NOTIFICATION=mongodb://notification-db:27017/notificationdb

# Service Ports
USER_SERVICE_PORT=3001
DOCTOR_SERVICE_PORT=3002
APPOINTMENT_SERVICE_PORT=3003
FEEDBACK_SERVICE_PORT=3004
NOTIFICATION_SERVICE_PORT=3005
FRONTEND_PORT=3000

# React App Environment Variables
REACT_APP_API_BASE_URL=http://localhost
REACT_APP_USER_SERVICE_PORT=3001
REACT_APP_DOCTOR_SERVICE_PORT=3002
REACT_APP_APPOINTMENT_SERVICE_PORT=3003
REACT_APP_FEEDBACK_SERVICE_PORT=3004
REACT_APP_NOTIFICATION_SERVICE_PORT=3005
```

Customize the values as needed.

### 2. Running with Docker Compose

To start all services using Docker Compose:

```bash
docker-compose up -d
```

This will:

- Start all MongoDB instances
- Build and start all microservices
- Build and start the frontend application

### 3. Accessing the Application

- Frontend: http://localhost:3000
- API Documentation:
  - User Service: http://localhost:3001/api-docs
  - Doctor Service: http://localhost:3002/api-docs
  - Appointment Service: http://localhost:3003/api-docs
  - Feedback Service: http://localhost:3004/api-docs
  - Notification Service: http://localhost:3005/api-docs

### 4. Local Development

To run individual services locally for development:

1. Navigate to the service directory:

   ```bash
   cd backend/user-service
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the service directory with the required environment variables.

4. Run the service:
   ```bash
   npm run dev
   ```

For the frontend:

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm start
   ```

## Initial Setup

After starting the application for the first time:

1. Register an admin user through the registration page
2. Use the admin user to add medical specializations
3. Register doctor users who can then complete their profiles

## Features

- User registration and authentication (JWT-based)
- Doctor profile management with specializations and available slots
- Appointment booking with date/time selection
- Appointment management (view, cancel, mark as completed)
- Patient feedback system
- Email notifications for appointment status changes
