const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'smtp',
  auth: {
    user: process.env.EMAIL_USER || 'your_email@example.com',
    pass: process.env.EMAIL_PASSWORD || 'your_email_password',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise} - Resolves with info on success, rejects with error on failure
 */
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your_email@example.com',
    to,
    subject,
    text,
    html: html || text,
  };

  // For development/testing, log email instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('Email notification (development mode):');
    console.log(mailOptions);
    return Promise.resolve({ messageId: 'dev-mode-email' });
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
