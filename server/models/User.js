const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  dob: Date,
  conditions: [String],           // e.g. ['diabetes', 'hypertension']
  sharedWithDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  thresholds: {                   // patient-defined alert thresholds
    glucoseMax: { type: Number, default: 180 },
    bpSystolicMax: { type: Number, default: 140 },
    heartRateMax: { type: Number, default: 100 }
  },
  aiAdvice:            String,   // full patient report markdown (7 sections)
  aiDoctorBrief:       String,   // clinical summary for doctor only
  aiAdviceGeneratedAt: Date,     // cache TTL — 24 hours
  sharedAiAdvice:      Boolean,  // true after patient shares with doctor
  consultationUrgency: { type: String, enum: ['urgent', 'scheduled', 'none'], default: 'none' },
  doctorAnnotation:    String,   // doctor's annotation pushed back to patient
  doctorAnnotationBy:  String,   // doctor's name for display
  prevDoctorAnnotation:String,   // previous annotation stored when report regenerated
  dietaryPreferences:  [String], // e.g. ['vegetarian', 'no dairy']
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to hash passwords
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // If already a bcrypt hash, bypass hashing to prevent double encryption
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
