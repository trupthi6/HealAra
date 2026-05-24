const express = require('express');
const router = express.Router();
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const Medication = require('../models/Medication');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const { generateWeeklyReport, generateDoctorBriefPDF } = require('../utils/pdfGenerator');

// GET /api/reports/weekly - Generate and stream PDF report of the past 7 days
// Query params: ?patientId=USER_ID & type=patient|doctor
router.get('/weekly', auth, async (req, res) => {
  try {
    const type = req.query.type || 'patient';
    let targetUserId = req.query.patientId || req.user._id;

    const patient = await User.findById(targetUserId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Role-based Access Control Verification
    if (type === 'doctor') {
      // Must be a doctor to request doctor briefs
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ success: false, message: 'Access denied. Only doctors can access clinical briefs.' });
      }

      // Verify the patient has shared their AI advice with this doctor
      const isSharedDoctor = patient.sharedWithDoctors &&
        patient.sharedWithDoctors.map(id => id.toString()).includes(req.user._id.toString());
      if (!isSharedDoctor || !patient.sharedAiAdvice) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Patient has not shared their AI report with you yet.'
        });
      }
    } else {
      // type === 'patient'
      if (req.user.role === 'doctor') {
        // Doctors can download the patient weekly report as long as patient is in their shared list
        const isSharedWithDoc = patient.sharedWithDoctors &&
          patient.sharedWithDoctors.map(id => id.toString()).includes(req.user._id.toString());
        if (!isSharedWithDoc) {
          return res.status(403).json({ success: false, message: 'Access denied. Patient data not shared with you.' });
        }
      } else if (req.user.role === 'admin') {
        // Admins can download any report
      } else {
        // Patient requesting own report
        if (targetUserId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied. You cannot view another patient\'s report.' });
        }
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch data for the PDF report (sorted ascending for daily vitals table sequence in PDF)
    const logs = await HealthLog.find({
      userId: targetUserId,
      loggedAt: { $gte: sevenDaysAgo }
    }).sort({ loggedAt: 1 });

    const medications = await Medication.find({
      userId: targetUserId,
      active: true
    }).sort({ name: 1 });

    const alerts = await Alert.find({
      userId: targetUserId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 });

    // Set Response PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    const filenamePrefix = type === 'doctor' ? 'doctor_brief' : 'weekly_report';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filenamePrefix}_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    );

    if (type === 'doctor') {
      generateDoctorBriefPDF(
        res,
        patient,
        patient.aiDoctorBrief || '',
        patient.consultationUrgency || 'none',
        logs,
        medications,
        alerts
      );
    } else {
      generateWeeklyReport(
        res,
        patient,
        logs,
        medications,
        alerts,
        patient.aiAdvice || ''
      );
    }

  } catch (err) {
    console.error('Error streaming PDF report:', err);
    res.status(500).json({ success: false, message: 'Server error generating weekly report.' });
  }
});

module.exports = router;
