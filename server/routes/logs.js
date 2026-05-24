const express = require('express');
const router = express.Router();
const HealthLog = require('../models/HealthLog');
const User = require('../models/User'); // Required for doctor check
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { checkAnomaliesForLogs } = require('../jobs/anomalyDetector');

// POST /api/logs/ - Create a health log (patient only)
router.post('/', auth, roleCheck('patient'), async (req, res) => {
  try {
    const { vitals, symptoms, moodScore, notes, source, loggedAt } = req.body;

    const newLog = new HealthLog({
      userId: req.user._id,
      loggedAt: loggedAt || Date.now(),
      vitals: vitals || {},
      symptoms: symptoms || [],
      moodScore,
      notes,
      source: source || 'manual'
    });

    await newLog.save();

    // Trigger anomaly detection immediately in the background for last 5 minutes
    setImmediate(() => {
      checkAnomaliesForLogs(5).catch(err => console.error('[Immediate Anomaly Trigger] Error:', err));
    });

    res.status(201).json({ success: true, log: newLog });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error saving health log.' });
  }
});

// GET /api/logs/ - Get paginated logs for current user (patient only)
router.get('/', auth, roleCheck('patient'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const count = await HealthLog.countDocuments({ userId: req.user._id });
    const logs = await HealthLog.find({ userId: req.user._id })
      .sort({ loggedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      logs,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalLogs: count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving logs.' });
  }
});

// GET /api/logs/:id - Get a single log
router.get('/:id', auth, async (req, res) => {
  try {
    const log = await HealthLog.findById(req.id || req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Health log not found.' });
    }

    // Access control: Must be own log, or if doctor, patient must have shared with them
    if (log.userId.toString() !== req.user._id.toString()) {
      if (req.user.role === 'doctor') {
        const patient = await User.findById(log.userId);
        if (!patient || !patient.sharedWithDoctors.includes(req.user._id)) {
          return res.status(403).json({ success: false, message: 'Access denied. Patient data not shared.' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving log.' });
  }
});

// DELETE /api/logs/:id - Delete a log (patient only)
router.delete('/:id', auth, roleCheck('patient'), async (req, res) => {
  try {
    const log = await HealthLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Health log not found.' });
    }

    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own logs.' });
    }

    await log.deleteOne();
    res.json({ success: true, message: 'Health log deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting log.' });
  }
});

module.exports = router;
