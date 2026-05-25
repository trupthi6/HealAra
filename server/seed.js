const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const HealthLog = require('./models/HealthLog');
const Medication = require('./models/Medication');
const Alert = require('./models/Alert');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vitaltrack';

async function seedDB() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database. Cleaning collections...');

    // Clear existing data
    await User.deleteMany({});
    await HealthLog.deleteMany({});
    await Medication.deleteMany({});
    await Alert.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Collections cleared. Seeding default roles...');

    const auditEntries = [];

    // 1. Create Admin
    const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
    const admin = new User({
      name: "Admin",
      email: "admin@healara.com",
      password: adminPasswordHash,
      role: "admin"
    });
    await admin.save();
    console.log(`Admin created with ID: ${admin._id}`);

    const adminObj = admin.toObject();
    delete adminObj.password;
    auditEntries.push({ collectionName: 'User', recordId: admin._id, after: adminObj });

    // 2. Create Doctor
    const doctorPasswordHash = await bcrypt.hash("Doctor@123", 10);
    const doctor = new User({
      name: "Dr. Priya Sharma",
      email: "doctor@healara.com",
      password: doctorPasswordHash,
      role: "doctor",
      dob: new Date("1978-05-15")
    });
    await doctor.save();
    console.log(`Doctor created with ID: ${doctor._id}`);

    const doctorObj = doctor.toObject();
    delete doctorObj.password;
    auditEntries.push({ collectionName: 'User', recordId: doctor._id, after: doctorObj });

    // 3. Create Patients
    console.log('Inserting Patients...');
    const patientPasswordHash = await bcrypt.hash("Patient@123", 10);

    const patient1Advice = `## Weekly Overview
Hi Rahul Verma. You've logged your metrics diligently this week. Good job on keeping up your tracking streak despite experiencing occasional fatigue.

## Physical Health
Your average glucose level this week was 152 mg/dL. We noticed a couple of readings exceeding your threshold of 180 mg/dL on Tuesday and Thursday. Consistently elevated glucose levels can increase the risk of diabetic neuropathies over time — consult your doctor before making changes.
Here are your 5 action steps for the next week:
1. Walk for 15-20 minutes after every main meal to help lower postprandial glucose spikes.
2. Limit refined carbohydrate portions in your dinners.
3. Monitor your hydration levels by drinking at least 2.5L of water daily.
4. Keep a log of any numbness or tingling symptoms.
5. Take your metformin prescription at the scheduled times.

## Mental Wellness
Your lowest mood score was 5 on Wednesday, which coincided with a higher blood glucose reading of 192 mg/dL. Since your average mood score is 7, here is 1 sustaining activity: keep journaling your daily gratitude items.

## Nutrition Guide
- Foods to eat more of:
  * Bitter gourd — helps regulate blood glucose naturally.
  * Fenugreek seeds — high in soluble fiber to slow carbohydrate absorption.
  * Cinnamon — helps improve insulin sensitivity.
  * Spinach — rich in magnesium to support metabolic pathways.
  * Oats — low glycemic index carbohydrate source.
- Foods to reduce or avoid:
  * White bread — causes rapid blood glucose spikes.
  * Sugary sodas — high simple sugar content.
  * Fried snacks — slows digestion and prolongs hyperglycemia.
  * Processed juices — lacking fiber, leading to sudden glucose spikes.
- Meal timing tip: Try eating a high-protein breakfast before 8:30 AM to stabilize your morning glycemic curve.

## Lifestyle & Habits
- Build these habits:
  * Get 7-8 hours of restful sleep daily.
  * Practice 10 minutes of deep breathing exercises.
  * Limit screen time 30 minutes before bed.
- Habits to reduce:
  * Late-night snacking.
  * Sedentary sitting for more than 2 hours.
- This week's one focus: **Prioritize a 15-minute post-lunch walk.**

## Medication Reminder
Metformin, Atorvastatin, Lisinopril. No medication missed alerts. If you experience persistent dizziness, contact your doctor.

## Keep Going
Your dedication to logging your health details shows your strong commitment. Keep up the good work, Rahul!`;

    const patient1Brief = `## Clinical Summary for the Treating Physician
Patient: Rahul Verma, Age: 41, Conditions: diabetes
This week's vitals vs thresholds:
| Metric | Avg | Threshold | Status |
| Glucose | 152 mg/dL | 180 mg/dL | Elevated |
| BP | 125/81 mmHg | 140/90 mmHg | Normal |

## Risk Flags
- Glucose exceeded 180 mg/dL threshold on 2 days. Trajectory is stable.

## Recommended Consultation Urgency
SCHEDULED

## Nutrition Prescriptions to Discuss
- Bitter gourd: to support natural glucose regulation
- Soluble fiber sources (fenugreek/oats): to slow carbohydrate absorption
- Reduce simple sugars: white bread, sugary drinks

## Lifestyle Prescriptions to Discuss
- Postprandial walking: 15-20 minutes post-meals
- Sleep hygiene: target 7-8 hours restful sleep`;

    const patient1 = new User({
      name: "Rahul Verma",
      email: "patient1@healara.com",
      password: patientPasswordHash,
      role: "patient",
      dob: new Date("1985-04-12"),
      conditions: ['diabetes'],
      sharedWithDoctors: [doctor._id],
      thresholds: {
        glucoseMax: 180,
        bpSystolicMax: 140,
        heartRateMax: 100
      },
      dietaryPreferences: ['vegetarian'],
      aiAdvice: patient1Advice,
      aiDoctorBrief: patient1Brief,
      aiAdviceGeneratedAt: new Date(),
      sharedAiAdvice: true,
      consultationUrgency: 'scheduled'
    });
    await patient1.save();

    const p1Obj = patient1.toObject();
    delete p1Obj.password;
    auditEntries.push({ collectionName: 'User', recordId: patient1._id, after: p1Obj });

    const patient2Advice = `## Weekly Overview
Hi Aisha Patel. You have logged your details very well. Your blood pressure has experienced some slight fluctuations.

## Physical Health
Your average blood pressure was 138/87 mmHg. Your systolic reading exceeded your threshold of 135 mmHg on 3 occasions. Consistently elevated BP over several weeks increases cardiovascular risk — consult your doctor before making changes.
Here are your 5 action steps:
1. Limit daily sodium intake to less than 1500mg.
2. Engage in 30 minutes of moderate cardiovascular exercise like brisk walking.
3. Perform 5 minutes of mindful meditation during peak work hours.
4. Keep track of any dizziness or headache symptoms.
5. Take your Amlodipine prescription as directed.

## Mental Wellness
Your lowest mood score was 6 on Thursday, which correlated with your highest systolic BP reading of 148 mmHg. Since your average mood score is 8, maintain a daily gratitude log to keep up the positive trend.

## Nutrition Guide
- Foods to eat more of:
  * Bananas — rich in potassium to help lower blood pressure.
  * Garlic — contains allicin which can help reduce vascular tension.
  * Leafy greens — high in magnesium and nitrates.
  * Dark chocolate (in moderation) — contains flavonoids that promote vasodilation.
  * Berries — rich in antioxidants to support blood vessel health.
- Foods to reduce or avoid:
  * Processed soups — high sodium content.
  * Cured meats — high in sodium and preservatives.
  * Salty snacks — can raise acute blood pressure.
  * Excess caffeine — temporary spikes in arterial pressure.
- Meal timing tip: Try eating meals at consistent times to maintain overall autonomic nervous system balance.

## Lifestyle & Habits
- Build these habits:
  * Limit caffeine intake after 2:00 PM.
  * Walk 30 minutes daily.
  * Maintain a steady sleep schedule.
- Habits to reduce:
  * High sodium foods.
  * Sitting for extended periods without stretching.
- This week's one focus: **Reduce daily salt intake to under 1.5 grams.**

## Medication Reminder
Amlodipine, Losartan, Hydrochlorothiazide, Metoprolol. No missed medication alerts. If you feel dizzy, contact your physician.

## Keep Going
Excellent work on staying active with your logs. Your daily consistency is your greatest health asset.`;

    const patient2Brief = `## Clinical Summary for the Treating Physician
Patient: Aisha Patel, Age: 35, Conditions: hypertension
This week's vitals vs thresholds:
| Metric | Avg | Threshold | Status |
| Glucose | 105 mg/dL | 160 mg/dL | Normal |
| BP | 138/87 mmHg | 135/85 mmHg | Elevated |

## Risk Flags
- BP Systolic exceeded 135 mmHg threshold on 3 days. Trajectory is stable.

## Recommended Consultation Urgency
NO IMMEDIATE ACTION NEEDED

## Nutrition Prescriptions to Discuss
- Increase potassium (bananas/leafy greens)
- Incorporate garlic: to support blood pressure management
- Limit sodium intake to under 1500mg/day

## Lifestyle Prescriptions to Discuss
- Daily cardio: 30 minutes brisk walking
- Limit afternoon caffeine intake`;

    const patient2 = new User({
      name: "Aisha Patel",
      email: "patient2@healara.com",
      password: patientPasswordHash,
      role: "patient",
      dob: new Date("1990-09-23"),
      conditions: ['hypertension'],
      sharedWithDoctors: [doctor._id],
      thresholds: {
        glucoseMax: 160,
        bpSystolicMax: 135,
        heartRateMax: 105
      },
      dietaryPreferences: [],
      aiAdvice: patient2Advice,
      aiDoctorBrief: patient2Brief,
      aiAdviceGeneratedAt: new Date(),
      sharedAiAdvice: true,
      consultationUrgency: 'none'
    });
    await patient2.save();

    const p2Obj = patient2.toObject();
    delete p2Obj.password;
    auditEntries.push({ collectionName: 'User', recordId: patient2._id, after: p2Obj });

    console.log(`Patients created. P1 (Rahul): ${patient1._id}, P2 (Aisha): ${patient2._id}`);

    // 4. Create 30 Days of logs for each patient
    console.log('Generating 30 days of health logs...');
    const now = new Date();
    const p1Logs = [];
    const p2Logs = [];

    for (let i = 29; i >= 0; i--) {
      const loggedAt = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Patient 1: Rahul (diabetic, threshold: glucoseMax = 180)
      const p1Glucose = Math.round(110 + Math.random() * 85); // 110 - 195 (exceeds 180 sometimes)
      const p1Sys = Math.round(115 + Math.random() * 20); // 115 - 135
      const p1Dia = Math.round(75 + Math.random() * 12);  // 75 - 87
      const p1HR = Math.round(68 + Math.random() * 22);   // 68 - 90
      
      const p1Log = new HealthLog({
        userId: patient1._id,
        loggedAt,
        vitals: {
          glucose: p1Glucose,
          bpSystolic: p1Sys,
          bpDiastolic: p1Dia,
          heartRate: p1HR,
          weight: 78.5 + (Math.random() - 0.5),
          oxygenSat: Math.round(96 + Math.random() * 3),
          temperature: parseFloat((36.4 + Math.random() * 0.8).toFixed(1))
        },
        symptoms: Math.random() > 0.8 ? (p1Glucose > 180 ? ['fatigue', 'headache'] : ['fatigue']) : [],
        moodScore: Math.round(5 + Math.random() * 4), // 5 - 9
        notes: i === 0 ? "Feeling slightly tired today, glucose is a bit high." : "Routine daily vital log.",
        source: Math.random() > 0.3 ? 'manual' : 'wearable'
      });
      const savedP1Log = await p1Log.save();
      p1Logs.push(savedP1Log);
      auditEntries.push({ collectionName: 'HealthLog', recordId: savedP1Log._id, after: savedP1Log.toObject() });

      // Patient 2: Aisha (hypertensive, threshold: bpSystolicMax = 135)
      const p2Glucose = Math.round(80 + Math.random() * 60);  // 80 - 140
      const p2Sys = Math.round(120 + Math.random() * 30); // 120 - 150 (exceeds 135 sometimes)
      const p2Dia = Math.round(80 + Math.random() * 15);  // 80 - 95
      const p2HR = Math.round(70 + Math.random() * 25);   // 70 - 95

      const p2Log = new HealthLog({
        userId: patient2._id,
        loggedAt,
        vitals: {
          glucose: p2Glucose,
          bpSystolic: p2Sys,
          bpDiastolic: p2Dia,
          heartRate: p2HR,
          weight: 62.1 + (Math.random() - 0.5),
          oxygenSat: Math.round(97 + Math.random() * 2),
          temperature: parseFloat((36.3 + Math.random() * 0.6).toFixed(1))
        },
        symptoms: Math.random() > 0.85 ? (p2Sys > 135 ? ['headache', 'dizziness'] : ['headache']) : [],
        moodScore: Math.round(6 + Math.random() * 4), // 6 - 10
        notes: "Daily check-in.",
        source: 'manual'
      });
      const savedP2Log = await p2Log.save();
      p2Logs.push(savedP2Log);
      auditEntries.push({ collectionName: 'HealthLog', recordId: savedP2Log._id, after: savedP2Log.toObject() });
    }

    console.log('Health logs generated successfully.');

    // 5. Create Medications
    console.log('Inserting medications...');
    
    // Patient 1 meds
    const p1Meds = [
      { name: 'Metformin', dosage: '500mg', frequency: 'twice_daily', reminderTime: '08:00' },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'daily', reminderTime: '21:00' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'daily', reminderTime: '08:00' },
      { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'weekly', reminderTime: '09:00' },
      { name: 'Aspirin', dosage: '81mg', frequency: 'daily', reminderTime: '12:00' }
    ];
    for (const med of p1Meds) {
      const savedMed = await new Medication({ userId: patient1._id, ...med }).save();
      auditEntries.push({ collectionName: 'Medication', recordId: savedMed._id, after: savedMed.toObject() });
    }

    // Patient 2 meds
    const p2Meds = [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'daily', reminderTime: '08:00' },
      { name: 'Losartan', dosage: '50mg', frequency: 'daily', reminderTime: '08:00' },
      { name: 'Hydrochlorothiazide', dosage: '12.5mg', frequency: 'daily', reminderTime: '08:00' },
      { name: 'Metoprolol Succinate', dosage: '25mg', frequency: 'daily', reminderTime: '20:00' },
      { name: 'Omega-3 Fish Oil', dosage: '1000mg', frequency: 'twice_daily', reminderTime: '13:00' }
    ];
    for (const med of p2Meds) {
      const savedMed = await new Medication({ userId: patient2._id, ...med }).save();
      auditEntries.push({ collectionName: 'Medication', recordId: savedMed._id, after: savedMed.toObject() });
    }

    console.log('Medications generated successfully.');

    // 6. Create Alerts and Notifications
    console.log('Creating alerts and notifications...');
    
    const p1HighGlucoseLogs = p1Logs.filter(l => l.vitals.glucose > patient1.thresholds.glucoseMax).slice(0, 3);
    const p2HighBPLogs = p2Logs.filter(l => l.vitals.bpSystolic > patient2.thresholds.bpSystolicMax).slice(0, 3);

    // Patient 1 alerts
    for (let idx = 0; idx < p1HighGlucoseLogs.length; idx++) {
      const log = p1HighGlucoseLogs[idx];
      const message = `Alert: Glucose level of ${log.vitals.glucose} mg/dL is higher than limit of ${patient1.thresholds.glucoseMax} mg/dL.`;
      
      const savedAlert = await new Alert({
        userId: patient1._id,
        logId: log._id,
        type: 'glucose_high',
        message,
        severity: 'critical',
        resolved: false,
        createdAt: log.loggedAt
      }).save();
      auditEntries.push({ collectionName: 'Alert', recordId: savedAlert._id, after: savedAlert.toObject() });

      const savedNotif = await new Notification({
        userId: patient1._id,
        message,
        read: false,
        createdAt: log.loggedAt
      }).save();
      auditEntries.push({ collectionName: 'Notification', recordId: savedNotif._id, after: savedNotif.toObject() });
    }

    // Patient 2 alerts
    for (let idx = 0; idx < p2HighBPLogs.length; idx++) {
      const log = p2HighBPLogs[idx];
      const message = `Alert: Blood pressure of ${log.vitals.bpSystolic} mmHg is higher than systolic limit of ${patient2.thresholds.bpSystolicMax} mmHg.`;
      
      const savedAlert = await new Alert({
        userId: patient2._id,
        logId: log._id,
        type: 'bp_high',
        message,
        severity: 'critical',
        resolved: false,
        createdAt: log.loggedAt
      }).save();
      auditEntries.push({ collectionName: 'Alert', recordId: savedAlert._id, after: savedAlert.toObject() });

      const savedNotif = await new Notification({
        userId: patient2._id,
        message,
        read: false,
        createdAt: log.loggedAt
      }).save();
      auditEntries.push({ collectionName: 'Notification', recordId: savedNotif._id, after: savedNotif.toObject() });
    }

    // 7. Insert AuditLog entries for all seeded creations
    console.log(`Writing ${auditEntries.length} AuditLog entries...`);
    const auditLogs = auditEntries.map(entry => ({
      adminId: admin._id,
      action: 'CREATE',
      collectionName: entry.collectionName,
      recordId: entry.recordId,
      before: null,
      after: entry.after,
      timestamp: new Date()
    }));
    await AuditLog.insertMany(auditLogs);

    console.log('\n================================================================');
    console.log('Seed data successfully generated.');
    console.log('Use the following credentials to test the features:');
    console.log('Admin:   admin@healara.com   / Admin@123   → /admin');
    console.log('Doctor:  doctor@healara.com  / Doctor@123  → /doctor');
    console.log('Patient: patient1@healara.com / Patient@123 → /dashboard');
    console.log('================================================================\n');

    process.exit(0);

  } catch (err) {
    console.error('Error during database seeding:', err);
    process.exit(1);
  }
}

seedDB();
