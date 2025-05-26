const express = require('express');
const { body, validationResult } = require('express-validator');
const Specialization = require('../models/Specialization');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/specializations:
 *   post:
 *     summary: Create a new specialization (admin only)
 *     tags: [Specializations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Specialization created successfully
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized (not an admin)
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    auth,
    [
      body('name').notEmpty().withMessage('Specialization name is required'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized, admin access required' });
      }

      const { name, description } = req.body;

      // Check if specialization already exists
      let specialization = await Specialization.findOne({ name });
      if (specialization) {
        return res.status(400).json({ message: 'Specialization already exists' });
      }

      // Create new specialization
      specialization = new Specialization({
        name,
        description,
      });

      await specialization.save();
      res.status(201).json(specialization);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @swagger
 * /api/specializations:
 *   get:
 *     summary: Get all specializations
 *     tags: [Specializations]
 *     responses:
 *       200:
 *         description: List of specializations
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const specializations = await Specialization.find().sort({ name: 1 });
    res.json(specializations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/specializations/{id}:
 *   get:
 *     summary: Get specialization by ID
 *     tags: [Specializations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Specialization ID
 *     responses:
 *       200:
 *         description: Specialization found
 *       404:
 *         description: Specialization not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const specialization = await Specialization.findById(req.params.id);

    if (!specialization) {
      return res.status(404).json({ message: 'Specialization not found' });
    }

    res.json(specialization);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Specialization not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/specializations/{id}:
 *   put:
 *     summary: Update specialization (admin only)
 *     tags: [Specializations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Specialization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Specialization updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized (not an admin)
 *       404:
 *         description: Specialization not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, admin access required' });
    }

    const { name, description } = req.body;

    // Build specialization object
    const specializationFields = {};
    if (name) specializationFields.name = name;
    if (description) specializationFields.description = description;

    let specialization = await Specialization.findById(req.params.id);
    if (!specialization) {
      return res.status(404).json({ message: 'Specialization not found' });
    }

    // Check if name is changed and already exists
    if (name && name !== specialization.name) {
      const existingSpecialization = await Specialization.findOne({ name });
      if (existingSpecialization) {
        return res.status(400).json({ message: 'Specialization with that name already exists' });
      }
    }

    specialization = await Specialization.findByIdAndUpdate(
      req.params.id,
      { $set: specializationFields },
      { new: true }
    );

    res.json(specialization);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Specialization not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/specializations/{id}:
 *   delete:
 *     summary: Delete specialization (admin only)
 *     tags: [Specializations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Specialization ID
 *     responses:
 *       200:
 *         description: Specialization deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized (not an admin)
 *       404:
 *         description: Specialization not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, admin access required' });
    }

    const specialization = await Specialization.findById(req.params.id);
    if (!specialization) {
      return res.status(404).json({ message: 'Specialization not found' });
    }

    await specialization.remove();
    res.json({ message: 'Specialization removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Specialization not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
