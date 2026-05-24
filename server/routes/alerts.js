const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

// GET /api/alerts - Get all unresolved alerts for the current user, sorted newest first
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id, resolved: false })
      .populate('logId')
      .sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving alerts.' });
  }
});

// GET /api/alerts/all - Optional endpoint to fetch resolved/unresolved historical logs
router.get('/history', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id })
      .populate('logId')
      .sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving alert history.' });
  }
});

// PATCH /api/alerts/:id/resolve - Mark an alert as resolved
router.patch('/:id/resolve', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot resolve this alert.' });
    }

    alert.resolved = true;
    await alert.save();

    res.json({ success: true, alert, message: 'Alert resolved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error resolving alert.' });
  }
});

module.exports = router;
