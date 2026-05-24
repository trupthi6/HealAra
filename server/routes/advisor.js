const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { buildWeeklySummary, generateAdvice } = require('../utils/aiCoach');

// GET /api/advisor/weekly-advice - Streams AI coach advice (Patient only)
router.get('/weekly-advice', auth, roleCheck('patient'), async (req, res) => {
  try {
    const userId = req.user._id;
    const force = req.query.force === 'true';

    // Verify sufficient logs (>= 3 logs required)
    const summary = await buildWeeklySummary(userId);
    if (summary.weekSummary.totalLogs < 3) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_data',
        message: 'Log at least 3 days of vitals this week to unlock your AI health report.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cache TTL check: 24 hours. Bypassed if force query parameter is true.
    const cacheLimitMs = 24 * 60 * 60 * 1000;
    const hasCache = user.aiAdvice && user.aiAdviceGeneratedAt;
    const isCacheFresh = hasCache && (Date.now() - new Date(user.aiAdviceGeneratedAt).getTime() < cacheLimitMs);

    if (hasCache && isCacheFresh && !force) {
      return res.json({
        success: true,
        cached: true,
        aiAdvice: user.aiAdvice,
        aiAdviceGeneratedAt: user.aiAdviceGeneratedAt
      });
    }

    // Call generateAdvice, which handles headers and streams SSE chunks to the response object.
    await generateAdvice(userId, res);
  } catch (err) {
    console.error('Advisor route error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving advisor advice.' });
  }
});

// POST /api/advisor/share - Share generated advice with connected doctors (Patient only)
router.post('/share', auth, roleCheck('patient'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.sharedAiAdvice = true;
    await user.save();

    // Create notifications for each doctor this patient is shared with
    if (user.sharedWithDoctors && user.sharedWithDoctors.length > 0) {
      const notifications = user.sharedWithDoctors.map(doctorId => {
        return new Notification({
          userId: doctorId,
          message: `Patient ${user.name} has shared their weekly AI health report with you.`,
          read: false
        });
      });
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, message: 'Report shared successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error sharing health report.' });
  }
});

module.exports = router;
