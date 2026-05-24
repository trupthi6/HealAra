const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// PATCH /api/users/me/preferences - Update patient's dietary preferences (Patient only)
router.patch('/me/preferences', auth, roleCheck('patient'), async (req, res) => {
  try {
    const { dietaryPreferences } = req.body;

    if (!Array.isArray(dietaryPreferences)) {
      return res.status(400).json({ success: false, message: 'dietaryPreferences must be an array of strings.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.dietaryPreferences = dietaryPreferences;
    await user.save();

    res.json({
      success: true,
      message: 'Dietary preferences updated successfully.',
      dietaryPreferences: user.dietaryPreferences
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving preferences.' });
  }
});

module.exports = router;
