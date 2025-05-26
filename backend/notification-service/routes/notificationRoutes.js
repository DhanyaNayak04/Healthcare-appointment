const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003';

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the logged in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read/unread status
 *     responses:
 *       200:
 *         description: List of notifications
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const { isRead } = req.query;
    let query = { userId: req.user.id };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/notifications/appointment:
 *   post:
 *     summary: Create a notification for an appointment
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - type
 *             properties:
 *               appointmentId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [new, cancelled, completed, reminder]
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/appointment',
  [
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('type').isIn(['new', 'cancelled', 'completed', 'reminder']).withMessage('Invalid notification type'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { appointmentId, type } = req.body;

      // Fetch appointment details
      let appointment;
      try {
        const appointmentResponse = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`);
        appointment = appointmentResponse.data;
      } catch (error) {
        console.error('Error fetching appointment:', error.message);
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Fetch patient details
      let patient;
      try {
        const patientResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${appointment.patientId}`);
        patient = patientResponse.data;
      } catch (error) {
        console.error('Error fetching patient:', error.message);
        return res.status(500).json({ message: 'Error fetching patient details' });
      }

      // Fetch doctor details
      let doctor;
      try {
        // Get doctor profile
        const doctorProfileResponse = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`);
        // Get doctor user details
        const doctorUserResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${doctorProfileResponse.data.userId}`);
        doctor = {
          ...doctorProfileResponse.data,
          user: doctorUserResponse.data
        };
      } catch (error) {
        console.error('Error fetching doctor:', error.message);
        return res.status(500).json({ message: 'Error fetching doctor details' });
      }

      // Format date and time for messages
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      const appointmentTime = appointment.startTime;

      // Create notifications for both patient and doctor
      const notifications = [];
      let patientMessage, doctorMessage;

      switch (type) {
        case 'new':
          patientMessage = `Your appointment with Dr. ${doctor.user.name} on ${appointmentDate} at ${appointmentTime} has been scheduled.`;
          doctorMessage = `New appointment with patient ${patient.name} on ${appointmentDate} at ${appointmentTime}.`;
          break;
        case 'cancelled':
          patientMessage = `Your appointment with Dr. ${doctor.user.name} on ${appointmentDate} at ${appointmentTime} has been cancelled.`;
          doctorMessage = `Appointment with patient ${patient.name} on ${appointmentDate} at ${appointmentTime} has been cancelled.`;
          break;
        case 'completed':
          patientMessage = `Your appointment with Dr. ${doctor.user.name} on ${appointmentDate} at ${appointmentTime} has been marked as completed.`;
          doctorMessage = `Appointment with patient ${patient.name} on ${appointmentDate} at ${appointmentTime} has been marked as completed.`;
          break;
        case 'reminder':
          patientMessage = `Reminder: You have an appointment with Dr. ${doctor.user.name} tomorrow at ${appointmentTime}.`;
          doctorMessage = `Reminder: You have an appointment with patient ${patient.name} tomorrow at ${appointmentTime}.`;
          break;
      }

      // Create patient notification
      const patientNotification = new Notification({
        userId: appointment.patientId,
        message: patientMessage,
        type: 'appointment',
        relatedId: appointmentId,
      });
      await patientNotification.save();
      notifications.push(patientNotification);

      // Create doctor notification
      const doctorNotification = new Notification({
        userId: doctor.userId,
        message: doctorMessage,
        type: 'appointment',
        relatedId: appointmentId,
      });
      await doctorNotification.save();
      notifications.push(doctorNotification);

      // Send email to patient if email available
      if (patient.email) {
        try {
          await sendEmail(
            patient.email,
            `Healthcare Appointment ${type === 'new' ? 'Confirmation' : 'Update'}`,
            patientMessage
          );
          patientNotification.sentViaEmail = true;
          await patientNotification.save();
        } catch (error) {
          console.error('Error sending email to patient:', error.message);
        }
      }

      // Send email to doctor if email available
      if (doctor.user.email) {
        try {
          await sendEmail(
            doctor.user.email,
            `Healthcare Appointment ${type === 'new' ? 'Notification' : 'Update'}`,
            doctorMessage
          );
          doctorNotification.sentViaEmail = true;
          await doctorNotification.save();
        } catch (error) {
          console.error('Error sending email to doctor:', error.message);
        }
      }

      res.status(201).json(notifications);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read for the logged in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Server error
 */
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
