const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/medications - Get all active medications for current patient
router.get('/', auth, roleCheck('patient'), async (req, res) => {
  try {
    const medications = await Medication.find({ userId: req.user._id, active: true }).sort({ name: 1 });
    res.json({ success: true, medications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching medications.' });
  }
});

// POST /api/medications - Create a new medication
router.post('/', auth, roleCheck('patient'), async (req, res) => {
  try {
    const { name, dosage, frequency, startDate, endDate, reminderTime } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Medication name is required.' });
    }

    const newMedication = new Medication({
      userId: req.user._id,
      name,
      dosage,
      frequency,
      startDate: startDate || Date.now(),
      endDate,
      reminderTime
    });

    await newMedication.save();
    res.status(201).json({ success: true, medication: newMedication });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error saving medication.' });
  }
});

// PATCH /api/medications/:id - Update medication (e.g. deactivating or changing dosage)
router.patch('/:id', auth, roleCheck('patient'), async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    if (medication.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot modify this medication.' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'dosage', 'frequency', 'startDate', 'endDate', 'active', 'reminderTime'];
    
    allowedUpdates.forEach(update => {
      if (updates[update] !== undefined) {
        medication[update] = updates[update];
      }
    });

    await medication.save();
    res.json({ success: true, medication });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating medication.' });
  }
});

// DELETE /api/medications/:id - Delete a medication
router.delete('/:id', auth, roleCheck('patient'), async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    if (medication.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot delete this medication.' });
    }

    await medication.deleteOne();
    res.json({ success: true, message: 'Medication deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting medication.' });
  }
});

module.exports = router;
