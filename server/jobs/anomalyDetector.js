const cron = require('node-cron');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');

// Core detection logic that can be scheduled or manually executed
async function checkAnomaliesForLogs(timeframeMinutes = 60) {
  try {
    const timeframe = new Date(Date.now() - timeframeMinutes * 60 * 1000);
    const logs = await HealthLog.find({ loggedAt: { $gte: timeframe } });

    console.log(`[Anomaly Job] Running. Scanning ${logs.length} logs created since ${timeframe.toISOString()}`);

    for (const log of logs) {
      const user = await User.findById(log.userId);
      if (!user || !user.thresholds) continue;

      const thresholds = user.thresholds;
      const vitals = log.vitals || {};

      // 1. Glucose check
      if (vitals.glucose && vitals.glucose > thresholds.glucoseMax) {
        await createAlertAndNotification(
          user._id,
          log._id,
          'glucose_high',
          `Alert: Your glucose level of ${vitals.glucose} mg/dL exceeds your limit of ${thresholds.glucoseMax} mg/dL.`,
          'critical'
        );
      }

      // 2. Systolic Blood Pressure check
      if (vitals.bpSystolic && vitals.bpSystolic > thresholds.bpSystolicMax) {
        await createAlertAndNotification(
          user._id,
          log._id,
          'bp_high',
          `Alert: Your blood pressure of ${vitals.bpSystolic}/${vitals.bpDiastolic || '-'} mmHg exceeds your systolic limit of ${thresholds.bpSystolicMax} mmHg.`,
          'critical'
        );
      }

      // 3. Heart Rate check
      if (vitals.heartRate && vitals.heartRate > thresholds.heartRateMax) {
        await createAlertAndNotification(
          user._id,
          log._id,
          'heart_rate_high',
          `Warning: Your heart rate of ${vitals.heartRate} bpm exceeds your limit of ${thresholds.heartRateMax} bpm.`,
          'warning'
        );
      }
    }
  } catch (err) {
    console.error('[Anomaly Job] Error during execution: ', err);
  }
}

// Create alert and notification, avoiding duplicate unresolved alerts for the same log and type
async function createAlertAndNotification(userId, logId, type, message, severity) {
  try {
    const duplicate = await Alert.findOne({
      logId,
      type,
      resolved: false
    });

    if (duplicate) {
      return; // Skip if unresolved alert of this type is already recorded
    }

    const alert = new Alert({
      userId,
      logId,
      type,
      message,
      severity,
      resolved: false
    });
    await alert.save();

    const notification = new Notification({
      userId,
      message,
      read: false
    });
    await notification.save();

    console.log(`[Anomaly Job] Generated ${severity} alert (${type}) for user ${userId}`);
  } catch (err) {
    console.error(`[Anomaly Job] Error saving alert for user ${userId}: `, err);
  }
}

// Schedule the job to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('[Anomaly Job] Running scheduled hourly scan...');
  await checkAnomaliesForLogs(60);
});

module.exports = {
  checkAnomaliesForLogs
};
