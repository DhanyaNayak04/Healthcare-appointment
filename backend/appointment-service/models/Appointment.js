const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - date
 *         - startTime
 *         - endTime
 *       properties:
 *         patientId:
 *           type: string
 *           description: ID of the patient
 *         doctorId:
 *           type: string
 *           description: ID of the doctor
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the appointment
 *         startTime:
 *           type: string
 *           description: Start time of the appointment
 *         endTime:
 *           type: string
 *           description: End time of the appointment
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled]
 *           description: Status of the appointment
 *         reason:
 *           type: string
 *           description: Reason for the appointment
 *         notes:
 *           type: string
 *           description: Additional notes for the appointment
 */
const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Patient',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Doctor',
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    reason: {
      type: String,
    },
    notes: {
      type: String,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
