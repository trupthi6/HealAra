const { Anthropic } = require('@anthropic-ai/sdk');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const Medication = require('../models/Medication');
const Alert = require('../models/Alert');

const SYSTEM_PROMPT = `You are VitalTrack AI, a compassionate 360° health coach. You will receive a patient's 7-day health summary as JSON.

Generate a complete health report in two parts.

PART 1 — PATIENT REPORT (warm, plain language, encouraging, under 900 words):

## Weekly Overview
2-3 warm sentences summarising the week. Use the patient's name. Reference what went well and acknowledge what was tough.

## Physical Health
Key vitals observations with actual numbers from the data. Flag specific days above threshold. Then project 1-2 future health risks if current patterns continue (e.g. "Consistently elevated BP over several weeks increases cardiovascular risk"). Always follow risk mentions with "— consult your doctor before making changes."
Then list exactly 5 specific physical action steps for the next 7 days, each tailored to their conditions and this week's actual readings. Be specific, not generic (e.g. "Take a 20-minute walk after dinner — post-meal movement reduces glucose spikes").

## Mental Wellness
Read all 7 moodScore values and the moodTrend field. Identify the lowestMoodDay and gently note what was happening physically that day (vitals/symptoms that co-occurred).
Then give mood-adaptive recommendations:
- If avgMoodScore <= 4: suggest 3 specific activities (e.g. 10 minutes of morning sunlight exposure, writing 3 gratitude entries before bed, 4-7-8 breathing technique during stressful moments)
- If avgMoodScore 5-6: suggest 2 maintenance activities
- If avgMoodScore >= 7: suggest 1 habit to sustain the positive trend
- If moodScore <= 3 on 3 or more days: add a gentle paragraph recommending speaking to a mental health professional or counsellor. Phrase warmly, never alarmingly.

## Nutrition Guide
ALL food suggestions MUST respect the patient's dietaryPreferences array. If empty, give generally healthy suggestions.

"Foods to eat more of this week" — list minimum 5 specific foods with one-line reason tied to their condition (e.g. "Bitter gourd — known to help regulate blood glucose naturally"). Use bullet points.

"Foods to reduce or avoid" — list minimum 4 specific items with reason (e.g. "White rice in large portions — causes rapid blood glucose spike"). Use bullet points.

"Meal timing tip" — one specific tip based on their vitals pattern this week (e.g. "Your glucose readings were highest in morning logs — try a protein-rich breakfast before 8am to stabilise early glucose").

## Lifestyle & Habits
"Build these habits" — 3 specific habits with brief reason tied to their data (e.g. "Sleep by 10:30pm — your lowest mood days coincided with high resting heart rate, which disrupts sleep quality"). Use bullet points.
"Habits to reduce" — 2-3 specific things to cut based on symptoms and mood patterns (e.g. "If consuming caffeine after 3pm, reduce it — can elevate resting heart rate and worsen sleep"). Use bullet points.
"This week's one focus" — identify the single highest-impact change for this specific patient. Present it as a bold highlighted recommendation.

## Medication Reminder
Note active medications by name. Flag any medication_missed alerts this week. Advise: "If you experience [condition-relevant symptom], contact your doctor before your next scheduled appointment."

## Keep Going
2 sentences of genuine, specific encouragement connecting their physical effort this week to their emotional strength.

---

PART 2 — DOCTOR BRIEF (clinical tone, under 400 words)
Start this section with the EXACT marker on its own line: ---DOCTOR_BRIEF_START---

## Clinical Summary for the Treating Physician
Patient: [name], Age: [age], Conditions: [list]
This week's vitals vs thresholds: [table format: Metric | Avg | Threshold | Status]

## Risk Flags
List each vital that exceeded threshold, number of days it occurred, and trajectory (improving/worsening/stable). Use clinical language.

## Recommended Consultation Urgency
State EXACTLY ONE of these three on its own line:
URGENT (within 48 hours) — if severe or rapidly worsening anomalies
SCHEDULED (next routine appointment) — if moderate fluctuations
NO IMMEDIATE ACTION NEEDED — if readings are stable or improving

## Nutrition Prescriptions to Discuss
The food recommendations from the patient report, formatted as a clinical checklist for the physician to review and adjust.

## Lifestyle Prescriptions to Discuss
The habit recommendations in clinical terms.

## Mental Health Flag
If moodScore was <= 3 on 3 or more days, include this paragraph:
"Patient reported persistent low mood this week (mood score <= 3 on [N] days). Recommend considering standardised screening (PHQ-9) or referral to a mental health professional at next consultation."
If mood was not in this range, omit this section entirely.

End with the EXACT marker on its own line: ---DOCTOR_BRIEF_END---

Rules for both parts:
- Never diagnose. Always say "consult your doctor" for clinical decisions.
- All food suggestions must match dietaryPreferences exactly.
- Patient report: plain language, warm tone, no jargon without explanation.
- Doctor brief: clinical language, objective, structured.
- Use clean Markdown with ## headings throughout.`;

async function buildWeeklySummary(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch last 7 days HealthLogs, sorted by loggedAt asc
  const logs = await HealthLog.find({
    userId,
    loggedAt: { $gte: sevenDaysAgo }
  }).sort({ loggedAt: 1 });

  // Fetch active medications
  const medications = await Medication.find({
    userId,
    active: true
  }).select('name dosage frequency');

  // Fetch unresolved alerts from last 7 days
  const alerts = await Alert.find({
    userId,
    resolved: false,
    createdAt: { $gte: sevenDaysAgo }
  }).select('type message severity');

  // Calculate age
  let age = null;
  if (user.dob) {
    const today = new Date();
    const birthDate = new Date(user.dob);
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Vitals stats calculations
  const glucoseLogs = logs.filter(l => l.vitals && typeof l.vitals.glucose === 'number');
  const avgGlucose = glucoseLogs.length ? Math.round(glucoseLogs.reduce((sum, l) => sum + l.vitals.glucose, 0) / glucoseLogs.length) : null;
  const minGlucose = glucoseLogs.length ? Math.min(...glucoseLogs.map(l => l.vitals.glucose)) : null;
  const maxGlucose = glucoseLogs.length ? Math.max(...glucoseLogs.map(l => l.vitals.glucose)) : null;

  const bpLogs = logs.filter(l => l.vitals && typeof l.vitals.bpSystolic === 'number' && typeof l.vitals.bpDiastolic === 'number');
  const avgBpSystolic = bpLogs.length ? Math.round(bpLogs.reduce((sum, l) => sum + l.vitals.bpSystolic, 0) / bpLogs.length) : null;
  const avgBpDiastolic = bpLogs.length ? Math.round(bpLogs.reduce((sum, l) => sum + l.vitals.bpDiastolic, 0) / bpLogs.length) : null;

  const hrLogs = logs.filter(l => l.vitals && typeof l.vitals.heartRate === 'number');
  const avgHeartRate = hrLogs.length ? Math.round(hrLogs.reduce((sum, l) => sum + l.vitals.heartRate, 0) / hrLogs.length) : null;

  const moodLogs = logs.filter(l => typeof l.moodScore === 'number');
  const avgMoodScore = moodLogs.length ? parseFloat((moodLogs.reduce((sum, l) => sum + l.moodScore, 0) / moodLogs.length).toFixed(1)) : null;

  // Lowest mood day
  let lowestMoodDay = null;
  if (moodLogs.length) {
    const sortedMoodLogs = [...moodLogs].sort((a, b) => a.moodScore - b.moodScore);
    const lowestLog = sortedMoodLogs[0];
    lowestMoodDay = {
      date: lowestLog.loggedAt,
      mood: lowestLog.moodScore,
      vitals: lowestLog.vitals || {},
      symptoms: lowestLog.symptoms || []
    };
  }

  // Mood Trend
  let moodTrend = 'stable';
  if (moodLogs.length >= 2) {
    const mid = Math.ceil(moodLogs.length / 2);
    const firstHalf = moodLogs.slice(0, mid);
    const secondHalf = moodLogs.slice(mid);
    const firstAvg = firstHalf.reduce((sum, l) => sum + l.moodScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, l) => sum + l.moodScore, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 0.5) moodTrend = 'improving';
    else if (firstAvg - secondAvg > 0.5) moodTrend = 'declining';
    else moodTrend = 'stable';
  }

  // Streak (consecutive days with at least one log up to today)
  const logDates = new Set(logs.map(l => new Date(l.loggedAt).toDateString()));
  let streak = 0;
  let checkDate = new Date();
  // If no log today, start check from yesterday
  if (!logDates.has(checkDate.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (logDates.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Symptoms aggregator
  const symptomsMap = {};
  logs.forEach(l => {
    if (l.symptoms && Array.isArray(l.symptoms)) {
      l.symptoms.forEach(s => {
        symptomsMap[s] = (symptomsMap[s] || 0) + 1;
      });
    }
  });
  const symptomsThisWeek = Object.entries(symptomsMap)
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count);

  const dailyLogs = logs.map(l => ({
    date: l.loggedAt,
    glucose: l.vitals?.glucose || null,
    bpSystolic: l.vitals?.bpSystolic || null,
    bpDiastolic: l.vitals?.bpDiacholic || l.vitals?.bpDiastolic || null,
    heartRate: l.vitals?.heartRate || null,
    mood: l.moodScore,
    symptoms: l.symptoms || [],
    notes: l.notes || ''
  }));

  return {
    patient: {
      name: user.name,
      age,
      conditions: user.conditions || [],
      thresholds: user.thresholds || {},
      dietaryPreferences: user.dietaryPreferences || []
    },
    weekSummary: {
      avgGlucose, minGlucose, maxGlucose,
      avgBpSystolic, avgBpDiastolic,
      avgHeartRate, avgMoodScore,
      lowestMoodDay,
      moodTrend,
      totalLogs: logs.length,
      streak,
      symptomsThisWeek
    },
    medications: medications.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency })),
    alerts: alerts.map(a => ({ type: a.type, message: a.message, severity: a.severity })),
    dailyLogs
  };
}

async function generateAdvice(userId, res) {
  try {
    const summary = await buildWeeklySummary(userId);
    if (summary.weekSummary.totalLogs < 3) {
      const err = new Error('Insufficient logs');
      err.code = 'insufficient_data';
      throw err;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let fullText = '';

    if (!apiKey) {
      // Mock response for local development (no Anthropic API key)
      const medicationsList = summary.medications && summary.medications.length > 0
        ? summary.medications.map(m => `- **${m.name}** — ${m.dosage}, ${m.frequency}`).join('\n')
        : '- No active medications found. Keep up the good work!';

      const patientMockReport = `## Weekly Overview
You've had a great week, ${summary.patient.name}! You stayed consistent with your logs and showed excellent commitment to your health journey. Your dedication is truly inspiring.

## Physical Health
Your average glucose was ${summary.weekSummary.avgGlucose || 'within range'} mg/dL and your heart rate averaged ${summary.weekSummary.avgHeartRate || 'normal'} bpm this week. This is looking stable, but let's keep it steady.

Here are 5 action steps for next week:
- Take a 20-minute walk after dinner — post-meal movement reduces glucose spikes.
- Drink at least 8 glasses of water daily — hydration supports kidney function.
- Stretch for 10 minutes every morning — improves circulation and flexibility.
- Monitor your vitals at the same time each day for consistent readings.
- Avoid heavy meals within 2 hours of bedtime — supports better sleep and digestion.

## Mental Wellness
Your mood trend this week has been **${summary.weekSummary.moodTrend}** with an average score of ${summary.weekSummary.avgMoodScore || 'N/A'} out of 10.

Recommendations:
- Spend 10 minutes in morning sunlight — proven to regulate circadian rhythm and boost serotonin.
- Practice 4-7-8 breathing during stressful moments — inhale 4s, hold 7s, exhale 8s.

## Nutrition Guide
**Foods to eat more of this week:**
- Leafy greens (spinach, kale) — rich in magnesium which supports heart health.
- Whole grains (oats, brown rice) — provide sustained energy without glucose spikes.
- Berries — high in antioxidants that reduce inflammation.
- Nuts and seeds — healthy fats that support brain function.
- Legumes (lentils, chickpeas) — high in fibre and protein for satiety.

**Foods to reduce or avoid:**
- Highly processed sugars — cause rapid glucose spikes and energy crashes.
- White bread and refined carbs — raise blood glucose quickly.
- Excess salt — can elevate blood pressure over time.
- Deep-fried foods — increase LDL cholesterol levels.

**Meal timing tip:** Try to eat your largest meal at lunch and have a lighter dinner before 7:30pm to optimise digestion and glucose regulation overnight.

## Lifestyle & Habits
**Build these habits:**
- Sleep by 10:30pm — consistent sleep timing regulates cortisol and blood pressure.
- Take a 5-minute walk every hour if sedentary — breaks up long sitting periods.
- Drink a glass of water first thing in the morning — kickstarts metabolism.

**Habits to reduce:**
- Reduce caffeine after 3pm — can elevate resting heart rate and disrupt sleep quality.
- Avoid screen time 30 minutes before bed — blue light suppresses melatonin production.

**This week's one focus:** **Prioritise getting 8 hours of sleep each night** — quality sleep is the single highest-impact change you can make for your overall health right now.

## Medication Reminder
Your active medications this week:
${medicationsList}

If you experience any unusual symptoms, contact your doctor before your next scheduled appointment.

## Keep Going
You are doing an amazing job taking control of your health, ${summary.patient.name}! Every small step you take today builds a stronger foundation for tomorrow — keep going!`;

      const doctorBriefMock = `## Clinical Summary for the Treating Physician
Patient: ${summary.patient.name}, Age: ${summary.patient.age || 'N/A'}
Conditions: ${(summary.patient.conditions || []).join(', ') || 'None listed'}
Patient is showing stable vitals this week with no severe anomalies.

## Risk Flags
No severe risk flags identified this week.

## Recommended Consultation Urgency
NO IMMEDIATE ACTION NEEDED

## Nutrition Prescriptions to Discuss
- Increase fibre intake via whole grains and legumes.
- Reduce refined carbohydrate consumption.

## Lifestyle Prescriptions to Discuss
- Regular post-meal walking for glucose regulation.
- Consistent sleep schedule targeting 8 hours.`;

      // Save to DB (same as real flow)
      fullText = patientMockReport + '\n\n---DOCTOR_BRIEF_START---\n' + doctorBriefMock + '\n---DOCTOR_BRIEF_END---';

      // Stream ONLY the patient report to the frontend, line by line
      const lines = patientMockReport.split('\n');
      for (const line of lines) {
        const payload = line + '\n';
        res.write(`data: ${payload}\n\n`);
        await new Promise(r => setTimeout(r, 18));
      }
    } else {
      const anthropic = new Anthropic({ apiKey });
      const stream = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: JSON.stringify(summary) }],
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.text) {
          const text = chunk.delta.text;
          fullText += text;
          res.write(`data: ${text}\n\n`);
        }
      }
    }

    // Parsing sections out of full text
    let patientReport = fullText;
    let doctorBrief = null;
    let consultationUrgency = 'none';

    if (fullText.includes('---DOCTOR_BRIEF_START---')) {
      const parts = fullText.split('---DOCTOR_BRIEF_START---');
      patientReport = parts[0].trim();
      const afterBriefStart = parts[1] || '';
      
      if (afterBriefStart.includes('---DOCTOR_BRIEF_END---')) {
        const briefParts = afterBriefStart.split('---DOCTOR_BRIEF_END---');
        doctorBrief = briefParts[0].trim();
      } else {
        doctorBrief = afterBriefStart.trim();
      }
    }

    if (doctorBrief) {
      if (doctorBrief.toUpperCase().includes('URGENT')) {
        consultationUrgency = 'urgent';
      } else if (doctorBrief.toUpperCase().includes('SCHEDULED')) {
        consultationUrgency = 'scheduled';
      }
    }

    // Update patient user model
    const user = await User.findById(userId);
    if (user) {
      // Archive current annotation
      user.prevDoctorAnnotation = user.doctorAnnotation || '';
      user.doctorAnnotation = undefined;
      user.doctorAnnotationBy = undefined;

      user.aiAdvice = patientReport;
      user.aiDoctorBrief = doctorBrief;
      user.aiAdviceGeneratedAt = new Date();
      user.consultationUrgency = consultationUrgency;
      await user.save();
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Error generating advice stream:', err);
    res.write('data: [ERROR]\n\n');
    res.end();
  }
}

module.exports = {
  buildWeeklySummary,
  generateAdvice
};
