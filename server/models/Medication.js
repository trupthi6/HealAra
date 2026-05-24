const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dosage: String,
  frequency: { type: String, enum: ['daily', 'twice_daily', 'weekly', 'as_needed'] },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  active: { type: Boolean, default: true },
  reminderTime: String            // "08:00"
});

module.exports = mongoose.model('Medication', MedicationSchema);
