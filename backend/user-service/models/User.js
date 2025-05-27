const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// List of approved admin emails
const APPROVED_ADMIN_EMAILS = [
  'dhanya.is22@bmsce.ac.in',
  'siri.is22@bmsce.ac.in',
  'bhumika.is22@bmsce.ac.in'
];

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         name:
 *           type: string
 *           description: User's full name
 *         role:
 *           type: string
 *           enum: [patient, doctor, admin]
 *           description: User's role
 *         phone:
 *           type: string
 *           description: User's phone number
 *         address:
 *           type: string
 *           description: User's address
 *         profilePicture:
 *           type: string
 *           description: URL to user's profile picture
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: User's date of birth
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to check if email is approved for admin role
userSchema.statics.isApprovedAdminEmail = function(email) {
  return APPROVED_ADMIN_EMAILS.includes(email.toLowerCase());
};

const User = mongoose.model('User', userSchema);

module.exports = User;
