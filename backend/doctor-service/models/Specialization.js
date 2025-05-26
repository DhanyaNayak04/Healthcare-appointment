const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Specialization:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the specialization
 *         description:
 *           type: string
 *           description: Description of the specialization
 */
const specializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Specialization = mongoose.model('Specialization', specializationSchema);

module.exports = Specialization;
