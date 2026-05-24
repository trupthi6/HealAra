const mongoose = require('mongoose');

const HealthLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loggedAt: { type: Date, default: Date.now },
  vitals: {
    glucose: Number,              // mg/dL
    bpSystolic: Number,           // mmHg
    bpDiastolic: Number,
    heartRate: Number,            // bpm
    weight: Number,               // kg
    oxygenSat: Number,            // %
    temperature: Number           // °C
  },
  symptoms: [String],             // e.g. ['headache', 'fatigue']
  moodScore: { type: Number, min: 1, max: 10 },
  notes: String,
  source: { type: String, enum: ['manual', 'wearable'], default: 'manual' }
});

module.exports = mongoose.model('HealthLog', HealthLogSchema);
