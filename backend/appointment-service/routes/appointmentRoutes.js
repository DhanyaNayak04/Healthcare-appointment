const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

const router = express.Router();

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               doctorId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Bad request or validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    auth,
    [
      body('doctorId').notEmpty().withMessage('Doctor ID is required'),
      body('date').notEmpty().withMessage('Date is required'),
      body('startTime').notEmpty().withMessage('Start time is required'),
      body('endTime').notEmpty().withMessage('End time is required'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { doctorId, date, startTime, endTime, reason } = req.body;
      const patientId = req.user.id;

      // Check if appointment time is available
      const existingAppointment = await Appointment.findOne({
        doctorId,
        date: new Date(date),
        startTime,
        status: { $ne: 'cancelled' },
      });

      if (existingAppointment) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      // Create new appointment
      const appointment = new Appointment({
        patientId,
        doctorId,
        date,
        startTime,
        endTime,
        reason,
      });

      await appointment.save();

      // Send notification (async, don't wait for response)
      try {
        axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/appointment`, {
          appointmentId: appointment._id,
          type: 'new',
        }).catch(err => console.error('Notification service error:', err.message));
      } catch (error) {
        console.error('Error sending notification:', error.message);
        // Don't fail the appointment creation if notification fails
      }

      res.status(201).json(appointment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get appointments for logged in user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by appointment status
 *     responses:
 *       200:
 *         description: List of appointments
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // If user is a patient, show only their appointments
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } 
    // If user is a doctor, show only appointments where they are the doctor
    else if (req.user.role === 'doctor') {
      // Get doctor details to find doctorId
      try {
        const doctorResponse = await axios.get(
          `${DOCTOR_SERVICE_URL}/api/doctors/user/${req.user.id}`,
          { 
            headers: { 'x-auth-token': req.header('x-auth-token') },
            validateStatus: function(status) {
              // Accept 404 status to handle gracefully
              return status < 500;
            }
          }
        );
        
        if (doctorResponse.status === 404 || !doctorResponse.data) {
          // Return empty array if doctor profile doesn't exist yet
          return res.json([]);
        }
        
        query.doctorId = doctorResponse.data._id;
      } catch (error) {
        console.error('Error fetching doctor profile:', error.message);
        // Return empty array instead of error
        return res.json([]);
      }
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query).sort({ date: 1, startTime: 1 });

    // Fetch additional details for each appointment
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const appointmentObj = appointment.toObject();

        try {
          // Get patient details
          const patientResponse = await axios.get(
            `${USER_SERVICE_URL}/api/users/${appointment.patientId}`,
            { 
              validateStatus: function(status) {
                return status < 500;
              }
            }
          );
          
          if (patientResponse.status === 200) {
            appointmentObj.patient = patientResponse.data;
          }

          // Get doctor user details
          const doctorProfileResponse = await axios.get(
            `${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`,
            { 
              validateStatus: function(status) {
                return status < 500;
              }
            }
          );
          
          if (doctorProfileResponse.status === 200) {
            const doctorUserResponse = await axios.get(
              `${USER_SERVICE_URL}/api/users/${doctorProfileResponse.data.userId}`,
              { 
                validateStatus: function(status) {
                  return status < 500;
                }
              }
            );
            
            if (doctorUserResponse.status === 200) {
              appointmentObj.doctor = {
                ...doctorProfileResponse.data,
                user: doctorUserResponse.data
              };
            }
          }

          return appointmentObj;
        } catch (error) {
          console.error('Error fetching appointment details:', error.message);
          return appointmentObj;
        }
      })
    );

    res.json(appointmentsWithDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment found
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is authorized to view this appointment
    if (
      req.user.role !== 'admin' &&
      req.user.id !== appointment.patientId.toString()
    ) {
      // If user is a doctor, check if this is their appointment
      if (req.user.role === 'doctor') {
        try {
          const doctorResponse = await axios.get(
            `${DOCTOR_SERVICE_URL}/api/doctors/user/${req.user.id}`,
            { headers: { 'x-auth-token': req.header('x-auth-token') } }
          );
          
          if (doctorResponse.data._id !== appointment.doctorId.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this appointment' });
          }
        } catch (error) {
          console.error('Error fetching doctor profile:', error.message);
          return res.status(500).json({ message: 'Error checking authorization' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to view this appointment' });
      }
    }

    const appointmentObj = appointment.toObject();

    try {
      // Get patient details
      const patientResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${appointment.patientId}`);
      appointmentObj.patient = patientResponse.data;

      // Get doctor details
      const doctorProfileResponse = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`);
      const doctorUserResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${doctorProfileResponse.data.userId}`);
      
      appointmentObj.doctor = {
        ...doctorProfileResponse.data,
        user: doctorUserResponse.data
      };
    } catch (error) {
      console.error('Error fetching appointment details:', error.message);
    }

    res.json(appointmentObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       400:
 *         description: Bad request or validation error
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/status',
  [
    auth,
    [
      body('status').isIn(['scheduled', 'completed', 'cancelled']).withMessage('Invalid status'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { status, notes } = req.body;

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if user is authorized to update this appointment
      if (req.user.role !== 'admin') {
        // Patients can only cancel their own appointments
        if (req.user.role === 'patient') {
          if (req.user.id !== appointment.patientId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this appointment' });
          }
          
          // Patients can only cancel appointments, not mark them as completed
          if (status !== 'cancelled') {
            return res.status(403).json({ message: 'Patients can only cancel appointments' });
          }
        } 
        // Doctors can mark as completed or cancelled
        else if (req.user.role === 'doctor') {
          try {
            const doctorResponse = await axios.get(
              `${DOCTOR_SERVICE_URL}/api/doctors/user/${req.user.id}`,
              { headers: { 'x-auth-token': req.header('x-auth-token') } }
            );
            
            if (doctorResponse.data._id !== appointment.doctorId.toString()) {
              return res.status(403).json({ message: 'Not authorized to update this appointment' });
            }
          } catch (error) {
            console.error('Error fetching doctor profile:', error.message);
            return res.status(500).json({ message: 'Error checking authorization' });
          }
        }
      }

      // Update appointment
      appointment.status = status;
      if (notes) {
        appointment.notes = notes;
      }

      await appointment.save();

      // Send notification about status change
      try {
        axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/appointment`, {
          appointmentId: appointment._id,
          type: status,
        }).catch(err => console.error('Notification service error:', err.message));
      } catch (error) {
        console.error('Error sending notification:', error.message);
        // Don't fail the update if notification fails
      }

      res.json(appointment);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}/available:
 *   get:
 *     summary: Get available appointment slots for a doctor
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date to check availability
 *     responses:
 *       200:
 *         description: Available time slots
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.get('/doctor/:doctorId/available', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Get the day of week for the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(requestedDate);

    // Get doctor's available slots
    try {
      const doctorResponse = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
      const doctor = doctorResponse.data;
      
      // Find the slots for the requested day
      const daySlots = doctor.availableSlots.filter(
        slot => slot.day === dayOfWeek && slot.isAvailable
      );

      if (!daySlots.length) {
        return res.json([]);
      }

      // Get booked appointments for the doctor on the requested date
      const bookedAppointments = await Appointment.find({
        doctorId,
        date: {
          $gte: new Date(new Date(date).setHours(0, 0, 0)),
          $lt: new Date(new Date(date).setHours(23, 59, 59)),
        },
        status: { $ne: 'cancelled' },
      });

      // Convert booked times to a set for quick lookup
      const bookedTimes = new Set();
      bookedAppointments.forEach(appointment => {
        bookedTimes.add(appointment.startTime);
      });

      // Generate all possible time slots from the doctor's available hours
      const availableSlots = [];
      
      daySlots.forEach(slot => {
        // Parse start and end times
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        // Generate 30-minute slots
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (
          currentHour < endHour || 
          (currentHour === endHour && currentMinute < endMinute)
        ) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          
          // Add to available slots if not booked
          if (!bookedTimes.has(timeString)) {
            availableSlots.push(timeString);
          }
          
          // Increment by 30 minutes
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentHour += 1;
            currentMinute = 0;
          }
        }
      });

      res.json(availableSlots);
    } catch (error) {
      console.error('Error fetching doctor details:', error.message);
      return res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/appointments/upcoming:
 *   get:
 *     summary: Get upcoming appointments for logged in user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming appointments
 *       500:
 *         description: Server error
 */
router.get('/upcoming', auth, async (req, res) => {
  try {
    let query = {
      status: 'scheduled',
      date: { $gte: new Date() }
    };

    // If user is a patient, show only their appointments
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } 
    // If user is a doctor, show only appointments where they are the doctor
    else if (req.user.role === 'doctor') {
      // Get doctor details to find doctorId
      try {
        const doctorResponse = await axios.get(
          `${DOCTOR_SERVICE_URL}/api/doctors/user/${req.user.id}`,
          { 
            headers: { 'x-auth-token': req.header('x-auth-token') },
            validateStatus: function(status) {
              // Accept 404 status to handle gracefully
              return status < 500;
            }
          }
        );
        
        if (doctorResponse.status === 404 || !doctorResponse.data) {
          // Return empty array if doctor profile doesn't exist yet
          return res.json([]);
        }
        
        query.doctorId = doctorResponse.data._id;
      } catch (error) {
        console.error('Error fetching doctor profile:', error.message);
        // Return empty array instead of error
        return res.json([]);
      }
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(10);  // Limit to next 10 appointments

    // Fetch additional details for each appointment with error handling
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const appointmentObj = appointment.toObject();

        try {
          // Get patient details
          const patientResponse = await axios.get(
            `${USER_SERVICE_URL}/api/users/${appointment.patientId}`,
            { 
              validateStatus: function(status) {
                return status < 500;
              }
            }
          );
          
          if (patientResponse.status === 200) {
            appointmentObj.patient = patientResponse.data;
          }

          // Get doctor user details
          const doctorProfileResponse = await axios.get(
            `${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`,
            { 
              validateStatus: function(status) {
                return status < 500;
              }
            }
          );
          
          if (doctorProfileResponse.status === 200) {
            const doctorUserResponse = await axios.get(
              `${USER_SERVICE_URL}/api/users/${doctorProfileResponse.data.userId}`,
              { 
                validateStatus: function(status) {
                  return status < 500;
                }
              }
            );
            
            if (doctorUserResponse.status === 200) {
              appointmentObj.doctor = {
                ...doctorProfileResponse.data,
                user: doctorUserResponse.data
              };
            }
          }

          return appointmentObj;
        } catch (error) {
          console.error('Error fetching appointment details:', error.message);
          return appointmentObj;
        }
      })
    );

    res.json(appointmentsWithDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
