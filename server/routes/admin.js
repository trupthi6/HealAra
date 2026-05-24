const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const Medication = require('../models/Medication');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Rate Limiter Middleware: 100 requests per 15 minutes per IP
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Protect all admin routes (in order: auth, roleCheck, rateLimiter)
router.use(auth, roleCheck('admin'), rateLimiter);

// 2. express-validator check errors helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return res.status(422).json({ success: false, errors: errorArray });
  }
  next();
};

const LIMIT = 20;

// ==========================================
// AUDIT LOG HELPER
// ==========================================
async function writeAuditLog({ adminId, action, collectionName, recordId, before, after }) {
  try {
    const log = new AuditLog({
      adminId,
      action,
      collectionName,
      recordId,
      before,
      after
    });
    await log.save();
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// ==========================================
// GET /api/admin/stats
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalUsers = await User.countDocuments();
    const totalLogs = await HealthLog.countDocuments();
    const activeMedications = await Medication.countDocuments({ active: true });
    const unresolvedAlerts = await Alert.countDocuments({ resolved: false });

    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const logsThisWeek = await HealthLog.countDocuments({ loggedAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalLogs,
        activeMedications,
        unresolvedAlerts,
        newUsersThisWeek,
        logsThisWeek
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving admin stats.' });
  }
});

// ==========================================
// USERS CRUD
// ==========================================

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const skip = (page - 1) * LIMIT;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const count = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('_id name email role conditions createdAt thresholds dob')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(LIMIT);

    res.json({
      success: true,
      users,
      currentPage: page,
      totalPages: Math.ceil(count / LIMIT),
      totalUsers: count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error listing users.' });
  }
});

// POST /api/admin/users
router.post('/users', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin'),
  validate
], async (req, res) => {
  try {
    const { name, email, password, role, dob, conditions, thresholds } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(422).json({
        success: false,
        errors: [{ field: 'email', message: 'User with this email already exists.' }]
      });
    }

    const user = new User({
      name,
      email,
      password, // User schema pre-save handles hashing
      role,
      dob,
      conditions: conditions || [],
      thresholds: thresholds || { glucoseMax: 180, bpSystolicMax: 140, heartRateMax: 100 }
    });

    await user.save();

    const afterObj = user.toObject();
    delete afterObj.password;

    await writeAuditLog({
      adminId: req.user._id,
      action: 'CREATE',
      collectionName: 'User',
      recordId: user._id,
      before: null,
      after: afterObj
    });

    res.status(201).json({ success: true, user: afterObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error creating user.' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', [
  body('email').optional().isEmail().withMessage('Valid email format required'),
  body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin'),
  validate
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const beforeObj = user.toObject();
    delete beforeObj.password;

    const updates = req.body;
    const allowed = ['name', 'email', 'role', 'conditions', 'thresholds', 'dob'];

    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(422).json({
          success: false,
          errors: [{ field: 'password', message: 'Password must be at least 6 characters' }]
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updates.password, salt);
    }

    await user.save();

    const afterObj = user.toObject();
    delete afterObj.password;

    await writeAuditLog({
      adminId: req.user._id,
      action: 'UPDATE',
      collectionName: 'User',
      recordId: user._id,
      before: beforeObj,
      after: afterObj
    });

    res.json({ success: true, user: afterObj });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(422).json({
        success: false,
        errors: [{ field: 'email', message: 'User with this email already exists.' }]
      });
    }
    res.status(500).json({ success: false, message: err.message || 'Server error updating user.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // SELF-DELETE GUARD
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const beforeObj = user.toObject();
    delete beforeObj.password;

    // Write AuditLog entry before cascade deleting
    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'User',
      recordId: userId,
      before: beforeObj,
      after: null
    });

    // Cascade delete in specific order
    await HealthLog.deleteMany({ userId });
    await Medication.deleteMany({ userId });
    await Alert.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await AuditLog.deleteMany({ adminId: userId }); // Delete audit logs where this deleted user was the admin

    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'User and all associated data cascade deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting user.' });
  }
});

// ==========================================
// HEALTH LOGS CRUD
// ==========================================

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { userId, startDate, endDate } = req.query;
    const skip = (page - 1) * LIMIT;

    const filter = {};
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.loggedAt = {};
      if (startDate) filter.loggedAt.$gte = new Date(startDate);
      if (endDate) filter.loggedAt.$lte = new Date(endDate);
    }

    const count = await HealthLog.countDocuments(filter);
    const logs = await HealthLog.find(filter)
      .populate('userId', 'name email')
      .sort({ loggedAt: -1 })
      .skip(skip)
      .limit(LIMIT);

    res.json({
      success: true,
      logs,
      currentPage: page,
      totalPages: Math.ceil(count / LIMIT),
      totalLogs: count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error listing logs.' });
  }
});

// POST /api/admin/logs
router.post('/logs', [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid User ID format'),
  validate
], async (req, res) => {
  try {
    const { userId, loggedAt, vitals, symptoms, moodScore, notes, source } = req.body;

    const patient = await User.findById(userId);
    if (!patient) {
      return res.status(422).json({
        success: false,
        errors: [{ field: 'userId', message: 'User does not exist in the database.' }]
      });
    }

    if (patient.role !== 'patient') {
      return res.status(422).json({
        success: false,
        errors: [{ field: 'userId', message: 'User must have the role patient.' }]
      });
    }

    const log = new HealthLog({
      userId,
      loggedAt: loggedAt || Date.now(),
      vitals: vitals || {},
      symptoms: symptoms || [],
      moodScore,
      notes,
      source: source || 'manual'
    });

    await log.save();

    await writeAuditLog({
      adminId: req.user._id,
      action: 'CREATE',
      collectionName: 'HealthLog',
      recordId: log._id,
      before: null,
      after: log.toObject()
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error creating health log.' });
  }
});

// PATCH /api/admin/logs/:id
router.patch('/logs/:id', async (req, res) => {
  try {
    const log = await HealthLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Health log not found.' });
    }

    const beforeObj = log.toObject();

    const updates = req.body;
    const allowed = ['loggedAt', 'vitals', 'symptoms', 'moodScore', 'notes', 'source'];

    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        log[field] = updates[field];
      }
    });

    await log.save();

    await writeAuditLog({
      adminId: req.user._id,
      action: 'UPDATE',
      collectionName: 'HealthLog',
      recordId: log._id,
      before: beforeObj,
      after: log.toObject()
    });

    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error updating health log.' });
  }
});

// DELETE /api/admin/logs/:id
router.delete('/logs/:id', async (req, res) => {
  try {
    const log = await HealthLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Health log not found.' });
    }

    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'HealthLog',
      recordId: log._id,
      before: log.toObject(),
      after: null
    });

    await Alert.deleteMany({ logId: log._id });
    await HealthLog.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Health log deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting health log.' });
  }
});

// DELETE /api/admin/logs/bulk
router.delete('/logs/bulk', [
  body('ids').isArray({ min: 1, max: 100 }).withMessage('Must provide an array of between 1 and 100 IDs'),
  validate
], async (req, res) => {
  try {
    const { ids } = req.body;

    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'HealthLog',
      recordId: null,
      before: { deletedIds: ids },
      after: null
    });

    await Alert.deleteMany({ logId: { $in: ids } });
    await HealthLog.deleteMany({ _id: { $in: ids } });

    res.json({ success: true, message: 'Bulk health logs deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error bulk deleting health logs.' });
  }
});

// ==========================================
// MEDICATIONS CRUD
// ==========================================

// GET /api/admin/medications
router.get('/medications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { userId, active } = req.query;
    const skip = (page - 1) * LIMIT;

    const filter = {};
    if (userId) filter.userId = userId;
    if (active !== undefined && active !== '') {
      filter.active = active === 'true';
    }

    const count = await Medication.countDocuments(filter);
    const medications = await Medication.find(filter)
      .populate('userId', 'name email')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(LIMIT);

    res.json({
      success: true,
      medications,
      currentPage: page,
      totalPages: Math.ceil(count / LIMIT),
      totalMedications: count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error listing medications.' });
  }
});

// POST /api/admin/medications
router.post('/medications', [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid User ID format'),
  body('name').notEmpty().withMessage('Medication name is required'),
  body('frequency').isIn(['daily', 'twice_daily', 'weekly', 'as_needed']).withMessage('Invalid frequency value'),
  validate
], async (req, res) => {
  try {
    const { userId, name, dosage, frequency, startDate, endDate, active, reminderTime } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(422).json({
        success: false,
        errors: [{ field: 'userId', message: 'User does not exist in the database.' }]
      });
    }

    const medication = new Medication({
      userId,
      name,
      dosage,
      frequency,
      startDate: startDate || Date.now(),
      endDate,
      active: active !== undefined ? active : true,
      reminderTime
    });

    await medication.save();

    await writeAuditLog({
      adminId: req.user._id,
      action: 'CREATE',
      collectionName: 'Medication',
      recordId: medication._id,
      before: null,
      after: medication.toObject()
    });

    res.status(201).json({ success: true, medication });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error creating medication.' });
  }
});

// PATCH /api/admin/medications/:id
router.patch('/medications/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    const beforeObj = medication.toObject();

    const updates = req.body;
    const allowed = ['name', 'dosage', 'frequency', 'startDate', 'endDate', 'active', 'reminderTime'];

    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        medication[field] = updates[field];
      }
    });

    await medication.save();

    await writeAuditLog({
      adminId: req.user._id,
      action: 'UPDATE',
      collectionName: 'Medication',
      recordId: medication._id,
      before: beforeObj,
      after: medication.toObject()
    });

    res.json({ success: true, medication });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error updating medication.' });
  }
});

// DELETE /api/admin/medications/:id
router.delete('/medications/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'Medication',
      recordId: medication._id,
      before: medication.toObject(),
      after: null
    });

    await Medication.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Medication deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting medication.' });
  }
});

// DELETE /api/admin/medications/bulk
router.delete('/medications/bulk', [
  body('ids').isArray({ min: 1, max: 100 }).withMessage('Must provide an array of between 1 and 100 IDs'),
  validate
], async (req, res) => {
  try {
    const { ids } = req.body;

    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'Medication',
      recordId: null,
      before: { deletedIds: ids },
      after: null
    });

    await Medication.deleteMany({ _id: { $in: ids } });

    res.json({ success: true, message: 'Bulk medications deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error bulk deleting medications.' });
  }
});

// ==========================================
// ALERTS CRUD
// ==========================================

// GET /api/admin/alerts
router.get('/alerts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { resolved, type } = req.query;
    const skip = (page - 1) * LIMIT;

    const filter = {};
    if (resolved !== undefined && resolved !== '') {
      filter.resolved = resolved === 'true';
    }
    if (type) {
      filter.type = type;
    }

    const count = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(LIMIT);

    res.json({
      success: true,
      alerts,
      currentPage: page,
      totalPages: Math.ceil(count / LIMIT),
      totalAlerts: count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error listing alerts.' });
  }
});

// POST /api/admin/alerts
router.post('/alerts', [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid User ID format'),
  body('type').isIn(['glucose_high', 'bp_high', 'heart_rate_high', 'medication_missed']).withMessage('Invalid alert type'),
  body('severity').isIn(['warning', 'critical']).withMessage('Invalid severity value'),
  validate
], async (req, res) => {
  try {
    const { userId, logId, type, message, severity, resolved } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(422).json({
        success: false,
        errors: [{ field: 'userId', message: 'User does not exist in the database.' }]
      });
    }

    const alert = new Alert({
      userId,
      logId: logId || undefined,
      type,
      message: message || `Alert triggered: ${type}`,
      severity,
      resolved: resolved !== undefined ? resolved : false
    });

    await alert.save();

    await writeAuditLog({
      adminId: req.user._id,
      action: 'CREATE',
      collectionName: 'Alert',
      recordId: alert._id,
      before: null,
      after: alert.toObject()
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error creating alert.' });
  }
});

// PATCH /api/admin/alerts/:id
router.patch('/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    const beforeObj = alert.toObject();

    const updates = req.body;
    const allowed = ['message', 'severity', 'resolved'];

    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        alert[field] = updates[field];
      }
    });

    await alert.save();

    await writeAuditLog({
      adminId: req.user._id,
      action: 'UPDATE',
      collectionName: 'Alert',
      recordId: alert._id,
      before: beforeObj,
      after: alert.toObject()
    });

    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error updating alert.' });
  }
});

// DELETE /api/admin/alerts/:id
router.delete('/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'Alert',
      recordId: alert._id,
      before: alert.toObject(),
      after: null
    });

    await Alert.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Alert deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting alert.' });
  }
});

// DELETE /api/admin/alerts/bulk
router.delete('/alerts/bulk', [
  body('ids').isArray({ min: 1, max: 100 }).withMessage('Must provide an array of between 1 and 100 IDs'),
  validate
], async (req, res) => {
  try {
    const { ids } = req.body;

    await writeAuditLog({
      adminId: req.user._id,
      action: 'DELETE',
      collectionName: 'Alert',
      recordId: null,
      before: { deletedIds: ids },
      after: null
    });

    await Alert.deleteMany({ _id: { $in: ids } });

    res.json({ success: true, message: 'Bulk alerts deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error bulk deleting alerts.' });
  }
});

// ==========================================
// AUDIT LOGS (READ-ONLY)
// ==========================================

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { adminId, collectionName, action, startDate, endDate } = req.query;
    const skip = (page - 1) * LIMIT;

    const filter = {};
    if (adminId) filter.adminId = adminId;
    if (collectionName) filter.collectionName = collectionName;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const count = await AuditLog.countDocuments(filter);
    const auditLogs = await AuditLog.find(filter)
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(LIMIT);

    res.json({
      success: true,
      auditLogs,
      currentPage: page,
      totalPages: Math.ceil(count / LIMIT),
      totalAuditLogs: count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error listing audit logs.' });
  }
});

module.exports = router;
