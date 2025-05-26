const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       required:
 *         - appointmentId
 *         - patientId
 *         - doctorId
 *         - rating
 *       properties:
 *         appointmentId:
 *           type: string
 *           description: ID of the appointment
 *         patientId:
 *           type: string
 *           description: ID of the patient
 *         doctorId:
 *           type: string
 *           description: ID of the doctor
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating (1-5 stars)
 *         comment:
 *           type: string
 *           description: Optional comment with the feedback
 */
const feedbackSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
