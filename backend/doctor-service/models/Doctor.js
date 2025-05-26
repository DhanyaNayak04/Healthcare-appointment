const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       required:
 *         - userId
 *         - specialization
 *       properties:
 *         userId:
 *           type: string
 *           description: Reference to the User ID
 *         specialization:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of specialization IDs
 *         qualifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               degree:
 *                 type: string
 *               institution:
 *                 type: string
 *               year:
 *                 type: number
 *           description: Doctor's qualifications
 *         experience:
 *           type: number
 *           description: Years of experience
 *         bio:
 *           type: string
 *           description: Doctor's biography
 *         consultationFee:
 *           type: number
 *           description: Consultation fee
 *         availableSlots:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *               isAvailable:
 *                 type: boolean
 *           description: Doctor's available appointment slots
 */
const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    specializations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization',
        required: true,
      },
    ],
    qualifications: [
      {
        degree: {
          type: String,
          required: true,
        },
        institution: {
          type: String,
          required: true,
        },
        year: {
          type: Number,
          required: true,
        },
      },
    ],
    experience: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
