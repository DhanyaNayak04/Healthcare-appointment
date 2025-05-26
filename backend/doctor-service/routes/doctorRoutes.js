const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create a doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - specializations
 *             properties:
 *               userId:
 *                 type: string
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               qualifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     degree:
 *                       type: string
 *                     institution:
 *                       type: string
 *                     year:
 *                       type: number
 *               experience:
 *                 type: number
 *               bio:
 *                 type: string
 *               consultationFee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Doctor profile created successfully
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
      body('userId').notEmpty().withMessage('User ID is required'),
      body('specializations').isArray().withMessage('Specializations must be an array'),
      body('qualifications').isArray().withMessage('Qualifications must be an array'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is authorized (admin or the doctor themselves)
      if (req.user.role !== 'admin' && req.user.id !== req.body.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Check if doctor profile already exists
      let doctor = await Doctor.findOne({ userId: req.body.userId });
      if (doctor) {
        return res.status(400).json({ message: 'Doctor profile already exists' });
      }

      const {
        userId,
        specializations,
        qualifications,
        experience,
        bio,
        consultationFee,
        availableSlots,
      } = req.body;

      // Create doctor profile
      doctor = new Doctor({
        userId,
        specializations,
        qualifications,
        experience,
        bio,
        consultationFee,
        availableSlots,
      });

      await doctor.save();
      res.status(201).json(doctor);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter doctors by specialization ID
 *     responses:
 *       200:
 *         description: List of doctors
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { specialization } = req.query;
    let query = {};

    if (specialization) {
      query.specializations = specialization;
    }

    const doctors = await Doctor.find(query)
      .populate('specializations', 'name description')
      .sort({ createdAt: -1 });

    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor found
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('specializations', 'name description');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/doctors/user/{userId}:
 *   get:
 *     summary: Get doctor by user ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Doctor found
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.userId })
      .populate('specializations', 'name description');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               qualifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     degree:
 *                       type: string
 *                     institution:
 *                       type: string
 *                     year:
 *                       type: number
 *               experience:
 *                 type: number
 *               bio:
 *                 type: string
 *               consultationFee:
 *                 type: number
 *               availableSlots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     isAvailable:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Doctor profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if user is authorized (admin or the doctor themselves)
    if (req.user.role !== 'admin' && req.user.id !== doctor.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const {
      specializations,
      qualifications,
      experience,
      bio,
      consultationFee,
      availableSlots,
    } = req.body;

    // Build doctor object
    const doctorFields = {};
    if (specializations) doctorFields.specializations = specializations;
    if (qualifications) doctorFields.qualifications = qualifications;
    if (experience !== undefined) doctorFields.experience = experience;
    if (bio) doctorFields.bio = bio;
    if (consultationFee !== undefined) doctorFields.consultationFee = consultationFee;
    if (availableSlots) doctorFields.availableSlots = availableSlots;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: doctorFields },
      { new: true }
    ).populate('specializations', 'name description');

    res.json(updatedDoctor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/doctors/{id}/slots:
 *   put:
 *     summary: Update doctor's available slots
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availableSlots
 *             properties:
 *               availableSlots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     isAvailable:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Slots updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.put('/:id/slots', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if user is authorized (admin or the doctor themselves)
    if (req.user.role !== 'admin' && req.user.id !== doctor.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { availableSlots } = req.body;

    if (!availableSlots || !Array.isArray(availableSlots)) {
      return res.status(400).json({ message: 'Available slots must be an array' });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: { availableSlots } },
      { new: true }
    );

    res.json(updatedDoctor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
