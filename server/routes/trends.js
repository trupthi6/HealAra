const express = require('express');
const router = express.Router();
const HealthLog = require('../models/HealthLog');
const User = require('../models/User');
const Medication = require('../models/Medication');
const auth = require('../middleware/auth');

// Helper to determine target user and verify permissions
const getTargetUser = async (req, res) => {
  const patientId = req.query.patientId;
  if (!patientId) {
    return req.user._id; // default to current user
  }

  if (req.user.role === 'doctor') {
    const patient = await User.findById(patientId);
    if (!patient || !patient.sharedWithDoctors.map(id => id.toString()).includes(req.user._id.toString())) {
      res.status(403).json({ success: false, message: 'Access denied. Patient has not shared data with you.' });
      return null;
    }
    return patient._id;
  }

  if (patientId !== req.user._id.toString()) {
    res.status(403).json({ success: false, message: 'Access denied. You cannot view another patient\'s trends.' });
    return null;
  }

  return req.user._id;
};

// GET /api/trends/vitals?field=glucose&period=week
router.get('/vitals', auth, async (req, res) => {
  try {
    const targetUserId = await getTargetUser(req, res);
    if (!targetUserId) return; // response already sent

    const field = req.query.field || 'glucose';
    const period = req.query.period || 'week';

    // Verify valid field to prevent injection
    const allowedFields = ['glucose', 'bpSystolic', 'bpDiastolic', 'heartRate', 'weight', 'oxygenSat', 'temperature'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: `Invalid field: ${field}` });
    }

    const startDate = new Date();
    if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '3months') {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate.setDate(startDate.getDate() - 7); // week
    }
    // Set hours to 00:00:00 for the beginning of the period
    startDate.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          userId: targetUserId,
          loggedAt: { $gte: startDate },
          [`vitals.${field}`]: { $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt" } },
          avg: { $avg: `$vitals.${field}` }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          avg: { $round: ["$avg", 1] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ];

    const trends = await HealthLog.aggregate(pipeline);
    res.json({ success: true, trends });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving vitals trends.' });
  }
});

// GET /api/trends/mood?period=month
router.get('/mood', auth, async (req, res) => {
  try {
    const targetUserId = await getTargetUser(req, res);
    if (!targetUserId) return;

    const period = req.query.period || 'month';

    const startDate = new Date();
    if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '3months') {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          userId: targetUserId,
          loggedAt: { $gte: startDate },
          moodScore: { $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt" } },
          avg: { $avg: "$moodScore" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          avg: { $round: ["$avg", 1] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ];

    const trends = await HealthLog.aggregate(pipeline);
    res.json({ success: true, trends });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving mood trends.' });
  }
});

// GET /api/trends/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const targetUserId = await getTargetUser(req, res);
    if (!targetUserId) return;

    const totalLogs = await HealthLog.countDocuments({ userId: targetUserId });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch logs from the last 14 days
    const logsAll = await HealthLog.find({
      userId: targetUserId,
      loggedAt: { $gte: fourteenDaysAgo }
    }).sort({ loggedAt: 1 });

    const logs = logsAll.filter(l => new Date(l.loggedAt) >= weekAgo);
    const prevWeekLogs = logsAll.filter(l => new Date(l.loggedAt) < weekAgo);

    // Compute vitals averages
    const glucoseLogs = logs.filter(l => l.vitals && typeof l.vitals.glucose === 'number');
    const avgGlucose = glucoseLogs.length ? Math.round(glucoseLogs.reduce((sum, l) => sum + l.vitals.glucose, 0) / glucoseLogs.length) : null;

    const bpLogs = logs.filter(l => l.vitals && typeof l.vitals.bpSystolic === 'number' && typeof l.vitals.bpDiastolic === 'number');
    const avgBpSystolic = bpLogs.length ? Math.round(bpLogs.reduce((sum, l) => sum + l.vitals.bpSystolic, 0) / bpLogs.length) : null;
    const avgBpDiastolic = bpLogs.length ? Math.round(bpLogs.reduce((sum, l) => sum + l.vitals.bpDiastolic, 0) / bpLogs.length) : null;

    const hrLogs = logs.filter(l => l.vitals && typeof l.vitals.heartRate === 'number');
    const avgHeartRate = hrLogs.length ? Math.round(hrLogs.reduce((sum, l) => sum + l.vitals.heartRate, 0) / hrLogs.length) : null;

    const moodLogs = logs.filter(l => typeof l.moodScore === 'number');
    const avgMood = moodLogs.length ? parseFloat((moodLogs.reduce((sum, l) => sum + l.moodScore, 0) / moodLogs.length).toFixed(1)) : null;

    // Mood trend arrow
    let moodTrend = '→';
    if (moodLogs.length >= 2) {
      const mid = Math.ceil(moodLogs.length / 2);
      const firstHalf = moodLogs.slice(0, mid);
      const secondHalf = moodLogs.slice(mid);
      const firstAvg = firstHalf.reduce((sum, l) => sum + l.moodScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, l) => sum + l.moodScore, 0) / secondHalf.length;
      if (secondAvg - firstAvg > 0.5) moodTrend = '↑';
      else if (firstAvg - secondAvg > 0.5) moodTrend = '↓';
    }

    // Top 3 symptoms
    const symptomsMap = {};
    logs.forEach(l => {
      if (l.symptoms && Array.isArray(l.symptoms)) {
        l.symptoms.forEach(s => {
          symptomsMap[s] = (symptomsMap[s] || 0) + 1;
        });
      }
    });
    const topSymptoms = Object.entries(symptomsMap)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.symptom);

    // Active medications count
    const activeMedicationsCount = await Medication.countDocuments({
      userId: targetUserId,
      active: true
    });

    // Daily glucose values for sparkline (last 7 logs containing glucose)
    const dailyGlucose = glucoseLogs.slice(-7).map(l => l.vitals.glucose);

    // Calculate streak
    const logDates = await HealthLog.find({ userId: targetUserId }, 'loggedAt').sort({ loggedAt: -1 });
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

    // Weekly comparison trend calculator
    const getListAvg = (list, accessor) => {
      const filtered = list.filter(l => l.vitals && typeof accessor(l.vitals) === 'number');
      return filtered.length ? filtered.reduce((sum, l) => sum + accessor(l.vitals), 0) / filtered.length : null;
    };
    const getListMoodAvg = (list) => {
      const filtered = list.filter(l => typeof l.moodScore === 'number');
      return filtered.length ? filtered.reduce((sum, l) => sum + l.moodScore, 0) / filtered.length : null;
    };

    const curGluc = getListAvg(logs, v => v.glucose);
    const prevGluc = getListAvg(prevWeekLogs, v => v.glucose);
    const curBP = getListAvg(logs, v => v.bpSystolic);
    const prevBP = getListAvg(prevWeekLogs, v => v.bpSystolic);
    const curHR = getListAvg(logs, v => v.heartRate);
    const prevHR = getListAvg(prevWeekLogs, v => v.heartRate);
    const curMoodRating = getListMoodAvg(logs);
    const prevMoodRating = getListMoodAvg(prevWeekLogs);

    const computeTrend = (cur, prev, lowerIsBetter) => {
      if (cur === null || prev === null) return { direction: 'flat', status: 'stable' };
      const diff = cur - prev;
      if (Math.abs(diff) < 0.1) return { direction: 'flat', status: 'stable' };
      const isUp = diff > 0;
      if (lowerIsBetter) {
        return {
          direction: isUp ? 'up' : 'down',
          status: isUp ? 'worsening' : 'improving'
        };
      } else {
        return {
          direction: isUp ? 'up' : 'down',
          status: isUp ? 'improving' : 'worsening'
        };
      }
    };

    const trendsObj = {
      glucose: computeTrend(curGluc, prevGluc, true),
      bp: computeTrend(curBP, prevBP, true),
      hr: computeTrend(curHR, prevHR, true),
      mood: computeTrend(curMoodRating, prevMoodRating, false)
    };

    res.json({
      success: true,
      summary: {
        totalLogs,
        avgGlucose,
        avgBpSystolic,
        avgBpDiastolic,
        avgHeartRate,
        avgMood,
        moodTrend,
        streak,
        topSymptoms,
        activeMedicationsCount,
        dailyGlucose,
        trends: trendsObj
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving health summary.' });
  }
});

module.exports = router;
