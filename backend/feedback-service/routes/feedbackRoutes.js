const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

const router = express.Router();

// Service URLs
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback for an appointment
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - rating
 *             properties:
 *               appointmentId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Bad request or validation error
 *       403:
 *         description: Not authorized to submit feedback for this appointment
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    auth,
    [
      body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
      body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { appointmentId, rating, comment } = req.body;
      const patientId = req.user.id;

      // Verify that the appointment exists and belongs to this patient
      let appointment;
      try {
        const appointmentResponse = await axios.get(
          `${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`,
          { headers: { 'x-auth-token': req.header('x-auth-token') } }
        );
        appointment = appointmentResponse.data;
      } catch (error) {
        console.error('Error fetching appointment:', error.message);
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if appointment belongs to the patient
      if (appointment.patientId.toString() !== patientId) {
        return res.status(403).json({ message: 'Not authorized to submit feedback for this appointment' });
      }

      // Check if appointment is completed
      if (appointment.status !== 'completed') {
        return res.status(400).json({ message: 'Can only submit feedback for completed appointments' });
      }

      // Check if feedback already exists for this appointment
      const existingFeedback = await Feedback.findOne({ appointmentId });
      if (existingFeedback) {
        return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
      }

      // Create new feedback
      const feedback = new Feedback({
        appointmentId,
        patientId,
        doctorId: appointment.doctorId,
        rating,
        comment,
      });

      await feedback.save();

      // Send notification to doctor about the feedback (could be implemented here or via a message broker)

      res.status(201).json(feedback);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/feedback/doctor/{doctorId}:
 *   get:
 *     summary: Get all feedback for a doctor
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: List of feedback for the doctor
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Verify doctor exists
    try {
      await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
    } catch (error) {
      console.error('Error verifying doctor:', error.message);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const feedback = await Feedback.find({ doctorId }).sort({ createdAt: -1 });

    // Fetch patient details for each feedback
    const feedbackWithDetails = await Promise.all(
      feedback.map(async (fb) => {
        const feedbackObj = fb.toObject();

        try {
          // Get patient details
          const patientResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${fb.patientId}`);
          feedbackObj.patient = {
            name: patientResponse.data.name,
            // Don't include email or other sensitive info
          };

          return feedbackObj;
        } catch (error) {
          console.error('Error fetching patient details:', error.message);
          return feedbackObj;
        }
      })
    );

    res.json(feedbackWithDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/feedback/appointment/{appointmentId}:
 *   get:
 *     summary: Get feedback for a specific appointment
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Feedback for the appointment
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ appointmentId: req.params.appointmentId });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found for this appointment' });
    }

    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/feedback/patient:
 *   get:
 *     summary: Get all feedback submitted by the logged in patient
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feedback submitted by the patient
 *       500:
 *         description: Server error
 */
router.get('/patient', auth, async (req, res) => {
  try {
    // Only patients can access this endpoint
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied, patient only' });
    }

    const feedback = await Feedback.find({ patientId: req.user.id }).sort({ createdAt: -1 });

    // Fetch doctor details for each feedback
    const feedbackWithDetails = await Promise.all(
      feedback.map(async (fb) => {
        const feedbackObj = fb.toObject();

        try {
          // Get doctor profile
          const doctorResponse = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${fb.doctorId}`);
          
          // Get doctor user details
          const doctorUserResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${doctorResponse.data.userId}`);
          
          feedbackObj.doctor = {
            name: doctorUserResponse.data.name,
            specializations: doctorResponse.data.specializations,
          };

          // Get appointment details
          const appointmentResponse = await axios.get(
            `${APPOINTMENT_SERVICE_URL}/api/appointments/${fb.appointmentId}`,
            { headers: { 'x-auth-token': req.header('x-auth-token') } }
          );
          
          feedbackObj.appointment = {
            date: appointmentResponse.data.date,
            startTime: appointmentResponse.data.startTime,
          };

          return feedbackObj;
        } catch (error) {
          console.error('Error fetching details:', error.message);
          return feedbackObj;
        }
      })
    );

    res.json(feedbackWithDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/feedback/stats/doctor/{doctorId}:
 *   get:
 *     summary: Get feedback statistics for a doctor
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Feedback statistics
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.get('/stats/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Verify doctor exists
    try {
      await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
    } catch (error) {
      console.error('Error verifying doctor:', error.message);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const feedback = await Feedback.find({ doctorId });

    if (feedback.length === 0) {
      return res.json({
        averageRating: 0,
        totalFeedback: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      });
    }

    // Calculate average rating
    const totalRating = feedback.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / feedback.length;

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    feedback.forEach((item) => {
      ratingDistribution[item.rating]++;
    });

    res.json({
      averageRating,
      totalFeedback: feedback.length,
      ratingDistribution,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
