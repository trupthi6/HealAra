const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  adminId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:         { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  collectionName: { type: String, required: true },
  recordId:       { type: mongoose.Schema.Types.ObjectId, required: true },
  before:         mongoose.Schema.Types.Mixed,
  after:          mongoose.Schema.Types.Mixed,
  timestamp:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
