const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthLog' },
  type: { type: String, enum: ['glucose_high', 'bp_high', 'heart_rate_high', 'medication_missed'] },
  message: String,
  severity: { type: String, enum: ['warning', 'critical'], default: 'warning' },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', AlertSchema);
