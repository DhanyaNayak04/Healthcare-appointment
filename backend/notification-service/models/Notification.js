const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - message
 *         - type
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user receiving the notification
 *         message:
 *           type: string
 *           description: Notification message
 *         type:
 *           type: string
 *           enum: [appointment, system, feedback]
 *           description: Type of notification
 *         relatedId:
 *           type: string
 *           description: ID of related entity (appointment, feedback, etc.)
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         sentViaEmail:
 *           type: boolean
 *           description: Whether the notification was sent via email
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'system', 'feedback'],
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentViaEmail: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
