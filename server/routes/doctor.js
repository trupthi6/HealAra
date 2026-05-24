const express = require('express');
const router = express.Router();
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/doctor/patients - List patients shared with this doctor (Doctor only)
router.get('/patients', auth, roleCheck('doctor'), async (req, res) => {
  try {
    const patients = await User.find({
      role: 'patient',
      sharedWithDoctors: req.user._id
    }).select('-password');

    const patientsWithLogDate = await Promise.all(patients.map(async (patient) => {
      const lastLog = await HealthLog.findOne({ userId: patient._id })
        .sort({ loggedAt: -1 })
        .select('loggedAt');
      return {
        ...patient.toObject(),
        lastLogDate: lastLog ? lastLog.loggedAt : null
      };
    }));

    res.json({ success: true, patients: patientsWithLogDate });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving shared patients.' });
  }
});

// GET /api/doctor/patients/:patientId/logs - Read-only paginated logs of a shared patient (Doctor only)
router.get('/patients/:patientId/logs', auth, roleCheck('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify sharing status
    const patient = await User.findById(patientId);
    if (!patient || !patient.sharedWithDoctors.map(id => id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. Patient data not shared with you.' });
    }

    const count = await HealthLog.countDocuments({ userId: patientId });
    const logs = await HealthLog.find({ userId: patientId })
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
    res.status(500).json({ success: false, message: 'Server error retrieving patient logs.' });
  }
});

// GET /api/doctor/patients/:patientId/summary - Summary stats for a shared patient (Doctor only)
router.get('/patients/:patientId/summary', auth, roleCheck('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify sharing status
    const patient = await User.findById(patientId);
    if (!patient || !patient.sharedWithDoctors.map(id => id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied. Patient data not shared with you.' });
    }

    const totalLogs = await HealthLog.countDocuments({ userId: patientId });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Calculate averages for this week
    const avgPipeline = [
      {
        $match: {
          userId: patient._id,
          loggedAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: null,
          avgGlucose: { $avg: "$vitals.glucose" },
          avgBpSystolic: { $avg: "$vitals.bpSystolic" },
          avgBpDiastolic: { $avg: "$vitals.bpDiastolic" },
          avgHeartRate: { $avg: "$vitals.heartRate" }
        }
      }
    ];

    const avgResult = await HealthLog.aggregate(avgPipeline);
    const summaryVitals = avgResult[0] || { avgGlucose: null, avgBpSystolic: null, avgBpDiastolic: null };

    // Calculate streak
    const logDates = await HealthLog.find({ userId: patient._id }, 'loggedAt').sort({ loggedAt: -1 });
    let streak = 0;

    if (logDates.length > 0) {
      const dateStrings = logDates.map(log => {
        const d = new Date(log.loggedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      const uniqueDates = Array.from(new Set(dateStrings));

      if (uniqueDates.length > 0) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
          streak = 1;
          let current = new Date(uniqueDates[0]);
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i]);
            const diffTime = Math.abs(current - prev);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              streak++;
              current = prev;
            } else if (diffDays > 1) {
              break;
            }
          }
        }
      }
    }

    res.json({
      success: true,
      summary: {
        totalLogs,
        avgGlucose: summaryVitals.avgGlucose ? Math.round(summaryVitals.avgGlucose) : null,
        avgBpSystolic: summaryVitals.avgBpSystolic ? Math.round(summaryVitals.avgBpSystolic) : null,
        avgBpDiastolic: summaryVitals.avgBpDiastolic ? Math.round(summaryVitals.avgBpDiastolic) : null,
        avgHeartRate: summaryVitals.avgHeartRate ? Math.round(summaryVitals.avgHeartRate) : null,
        streak,
        thresholds: patient.thresholds,
        conditions: patient.conditions,
        dob: patient.dob,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving patient health summary.' });
  }
});

const Notification = require('../models/Notification');
const Medication = require('../models/Medication');

// GET /api/doctor/patients/:patientId/brief - Retrieve AI clinical brief for doctor (Doctor only)
router.get('/patients/:patientId/brief', auth, roleCheck('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({
      _id: patientId,
      sharedWithDoctors: req.user._id,
      sharedAiAdvice: true
    });

    if (!patient) {
      return res.status(403).json({ success: false, message: 'Access denied or patient did not share report.' });
    }

    if (!patient.aiDoctorBrief) {
      return res.json({ success: true, briefAvailable: false });
    }

    const medications = await Medication.find({ userId: patient._id, active: true }).select('name dosage frequency');

    // Compute week summary for vitals table
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const avgPipeline = [
      { $match: { userId: patient._id, loggedAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          avgGlucose: { $avg: "$vitals.glucose" },
          avgBpSystolic: { $avg: "$vitals.bpSystolic" },
          avgBpDiastolic: { $avg: "$vitals.bpDiastolic" },
          avgHeartRate: { $avg: "$vitals.heartRate" }
        }
      }
    ];
    const avgResult = await HealthLog.aggregate(avgPipeline);
    const vitals = avgResult[0] || {};

    // Earliest log date for "Monitoring Since"
    const earliestLog = await HealthLog.findOne({ userId: patient._id }).sort({ loggedAt: 1 }).select('loggedAt');

    res.json({
      success: true,
      briefAvailable: true,
      aiDoctorBrief: patient.aiDoctorBrief,
      aiAdviceGeneratedAt: patient.aiAdviceGeneratedAt,
      consultationUrgency: patient.consultationUrgency || 'none',
      patient: {
        name: patient.name,
        dob: patient.dob,
        conditions: patient.conditions || [],
        medications: medications.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency }))
      },
      weekSummary: {
        avgGlucose: vitals.avgGlucose ? Math.round(vitals.avgGlucose) : null,
        avgBpSystolic: vitals.avgBpSystolic ? Math.round(vitals.avgBpSystolic) : null,
        avgBpDiastolic: vitals.avgBpDiastolic ? Math.round(vitals.avgBpDiastolic) : null,
        avgHeartRate: vitals.avgHeartRate ? Math.round(vitals.avgHeartRate) : null,
        thresholds: patient.thresholds
      },
      earliestLogDate: earliestLog?.loggedAt || patient.createdAt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving doctor brief.' });
  }
});

// PATCH /api/doctor/patients/:patientId/brief/annotate - Add clinician note to patient's AI Advisor report (Doctor only)
router.patch('/patients/:patientId/brief/annotate', auth, roleCheck('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorNote } = req.body;

    if (!doctorNote) {
      return res.status(400).json({ success: false, message: 'Doctor note is required.' });
    }

    if (doctorNote.length > 500) {
      return res.status(400).json({ success: false, message: 'Doctor note cannot exceed 500 characters.' });
    }

    const patient = await User.findOne({
      _id: patientId,
      sharedWithDoctors: req.user._id,
      sharedAiAdvice: true
    });

    if (!patient) {
      return res.status(403).json({ success: false, message: 'Access denied or patient did not share report.' });
    }

    patient.doctorAnnotation = doctorNote;
    patient.doctorAnnotationBy = req.user.name;
    await patient.save();

    // Create notification for patient
    const notification = new Notification({
      userId: patient._id,
      message: `Dr. ${req.user.name} reviewed your weekly health report and left a note. Open your AI advisor to read it.`,
      read: false
    });
    await notification.save();

    res.json({ success: true, message: 'Note saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error adding annotation.' });
  }
});

module.exports = router;
