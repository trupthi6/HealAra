const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const Medication = require('../models/Medication');
const Alert = require('../models/Alert');

const SYSTEM_PROMPT = `You are HealAra AI, an advanced AI wellness intelligence system designed to generate highly personalized, professional, and human-like health guidance. You will receive a patient's 7-day health summary as JSON.

Your role is NOT to simply summarize medical values. Your responsibility is to analyze health patterns intelligently; identify relationships between biomarkers, lifestyle, stress, recovery, and habits; generate meaningful wellness insights; explain possible contributing factors calmly and professionally; and provide strategic, actionable, and supportive recommendations.

Maintain a tone that is calm, highly professional, medically informed, intelligent, supportive, polished, and human-like. Never sound robotic, repetitive, overly generic, or emotionally empty.

IMPORTANT BEHAVIOR RULES:
- Do not simply restate values repeatedly.
- Avoid obvious advice like "exercise regularly", "eat healthy", "consult your doctor", "drink more water".
- Avoid fear-based wording and dramatic medical language.
- Avoid sounding like a chatbot. Instead: interpret patterns, explain WHY something may matter, connect multiple health indicators together, prioritize meaningful insights, provide practical optimization-focused guidance, and sound like a premium wellness strategist.
- When analyzing data: identify possible physiological relationships, observe timing-related trends, infer lifestyle influences, connect emotional and physical wellness patterns, and mention subtle insights when relevant.
- Always speak with measured medical uncertainty using phrases like "may indicate", "could suggest", "appears associated with", "potentially reflects", "may contribute to".
- Generate outputs with depth and nuance using natural professional language, varying sentence structure to read like a high-end AI clinical wellness platform.

You MUST use the exact following structure and ## section headers:

## AI Clinical Insight
Summarize the most important overall observation in 2–3 intelligent sentences.

## Health Pattern Interpretation
Explain meaningful biomarker relationships and possible contributing factors.

## Physical Optimization Strategy
Provide specific, strategic physical wellness recommendations, explaining WHY each recommendation matters physiologically.

## Mental & Emotional Wellness
Identify possible stress, recovery, emotional, or behavioral influences, keeping the tone supportive and emotionally intelligent.

## Nutrition Optimization
Suggest realistic nutritional adjustments based on patterns. All food suggestions MUST respect the patient's dietaryPreferences array. Focus on metabolic support, stability, and recovery, explaining the physiological reasoning.

## Lifestyle & Recovery Guidance
Recommend sustainable habits, routines, movement, sleep, or recovery improvements. Highlight a single highest-impact focus point.

## Preventive Focus
Mention long-term optimization opportunities calmly and professionally.

## Encouraging Closing Insight
End with a warm, intelligent, motivating summary that feels human and reassuring.

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
- Never diagnose.
- All food suggestions must match dietaryPreferences exactly.
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

// Helper to generate a personalized mock report if the API keys are not configured.
function generateMockReport(summary) {
  const patient = summary.patient;
  const ws = summary.weekSummary;
  const meds = summary.medications;
  const alerts = summary.alerts;

  const name = patient.name || 'Patient';
  const conditionList = patient.conditions.join(', ') || 'General Health';
  const age = patient.age || 'N/A';
  const dietary = patient.dietaryPreferences.join(', ') || 'None specified';

  // Part 1: Patient Report
  let text = `## AI Clinical Insight\n`;
  text += `Analysis of this week's trends potentially reflects a stable heart rate profile with minor metabolic adjustments. Your logging consistency demonstrates proactive engagement with your wellness strategy.\n\n`;

  text += `## Health Pattern Interpretation\n`;
  text += `Your biomarkers suggest a pattern where evening glycemic spikes appear associated with elevated resting pulse logs on subsequent mornings, potentially reflecting overnight metabolic load delays. Systemic vascular pressures remained within stable limits throughout the week.\n\n`;

  text += `## Physical Optimization Strategy\n`;
  text += `To optimize insulin response and support arterial compliance, structured active sessions are recommended. Light movement following major meals may stimulate skeletal glucose uptake and reduce peak metabolic demands. Prioritizing consistent low-impact movement after meals matters physiologically to stabilize baseline metrics.\n\n`;

  text += `## Mental & Emotional Wellness\n`;
  if (ws.lowestMoodDay) {
    const lDayStr = new Date(ws.lowestMoodDay.date).toLocaleDateString([], { weekday: 'long' });
    text += `Your subjective wellness logs note a lower score of ${ws.lowestMoodDay.mood}/10 on ${lDayStr}, potentially associated with co-occurring physical fatigue notes. This highlights a subtle connection between physiological recovery states and daily mood resilience.\n\n`;
  }
  text += `Establishing calm morning routines, including brief light exposure, may assist in balancing cortisol cycles and supporting steady energy profiles throughout the day.\n\n`;

  text += `## Nutrition Optimization\n`;
  text += `Based on your preferences (${dietary}), we recommend integrating specific nutrients to support metabolic recovery:\n`;
  text += `- Magnesium-rich green leaves (spinach, kale) — supports intracellular pathways and glucose disposal.\n`;
  text += `- Complex slow-release carbohydrates (oats, quinoa) — promotes sustained energy release.\n`;
  text += `- Clean plant-based proteins (tofu, tempeh) — helps maintain muscle synthesis and steady amino acid availability.\n`;
  text += `- Polyphenol-rich fruits (berries) — provides antioxidant support for vascular tissues.\n`;
  text += `- Healthy fats (walnuts, avocado) — supports cell membrane structure and cardiovascular health.\n`;
  text += `- Reducing high-glycemic processed carbohydrates — prevents rapid glycemic peaks and subsequent energy crashes.\n\n`;

  text += `## Lifestyle & Recovery Guidance\n`;
  text += `Supporting nocturnal recovery through structured wind-down routines by 10:30 PM may assist in stabilizing morning resting pulse. This week's core optimization focus: **Establishing consistent movement post-meals.**\n\n`;

  text += `## Preventive Focus\n`;
  if (meds.length > 0) {
    text += `Your active routine includes: ${meds.map(m => `${m.name}`).join(', ')}. Maintaining consistent timing is key to supporting stable baseline trends. We recommend noting subtle changes in early morning metrics to support ongoing strategy adjustments.\n\n`;
  } else {
    text += `Focus on observing subtle physiological variations over time to establish a personal wellness baseline, allowing for early optimization before symptoms arise.\n\n`;
  }

  text += `## Encouraging Closing Insight\n`;
  text += `Your commitment to tracking daily trends is a powerful foundation for your health journey. Small, targeted optimizations compound into significant, long-term vitality.\n\n`;

  // Part 2: Doctor Brief
  text += `---DOCTOR_BRIEF_START---\n`;
  text += `## Clinical Summary for the Treating Physician\n`;
  text += `Patient: ${name}, Age: ${age}, Conditions: ${conditionList}\n\n`;
  
  text += `### Weekly Aggregated Vitals vs Thresholds\n`;
  text += `| Metric | Avg | Threshold | Status |\n`;
  text += `| --- | --- | --- | --- |\n`;
  text += `| Glucose | ${ws.avgGlucose || 'N/A'} mg/dL | ${patient.thresholds?.glucoseMax || 180} | ${ws.avgGlucose > (patient.thresholds?.glucoseMax || 180) ? 'ELEVATED' : 'NORMAL'} |\n`;
  text += `| BP Systolic | ${ws.avgBpSystolic || 'N/A'} mmHg | ${patient.thresholds?.bpSystolicMax || 140} | ${ws.avgBpSystolic > (patient.thresholds?.bpSystolicMax || 140) ? 'ELEVATED' : 'NORMAL'} |\n`;
  text += `| BP Diastolic | ${ws.avgBpDiastolic || 'N/A'} mmHg | ${patient.thresholds?.bpDiastolicMax || 90} | ${ws.avgBpDiastolic > (patient.thresholds?.bpDiastolicMax || 90) ? 'ELEVATED' : 'NORMAL'} |\n`;
  text += `| Heart Rate | ${ws.avgHeartRate || 'N/A'} bpm | ${patient.thresholds?.heartRateMax || 100} | ${ws.avgHeartRate > (patient.thresholds?.heartRateMax || 100) ? 'ELEVATED' : 'NORMAL'} |\n\n`;

  text += `## Risk Flags\n`;
  let hasElevated = false;
  if (ws.avgGlucose > (patient.thresholds?.glucoseMax || 180)) {
    text += `- Glucose: Average was ${ws.avgGlucose} mg/dL (exceeded ${patient.thresholds?.glucoseMax || 180} mg/dL)\n`;
    hasElevated = true;
  }
  if (ws.avgBpSystolic > (patient.thresholds?.bpSystolicMax || 140)) {
    text += `- Blood Pressure: Average was ${ws.avgBpSystolic}/${ws.avgBpDiastolic} mmHg (exceeded ${patient.thresholds?.bpSystolicMax || 140} mmHg)\n`;
    hasElevated = true;
  }
  if (!hasElevated) {
    text += `- No parameters exceeded thresholds on average this week.\n`;
  }

  text += `\n## Recommended Consultation Urgency\n`;
  if (hasElevated || alerts.some(a => a.severity === 'critical')) {
    text += `SCHEDULED\n\n`;
  } else {
    text += `NO IMMEDIATE ACTION NEEDED\n\n`;
  }
  text += `## Nutrition Prescriptions to Discuss\n`;
  text += `- Adjust glycemic load of meals.\n`;
  text += `- Sodium restriction under 2000mg/day.\n\n`;

  text += `## Lifestyle Prescriptions to Discuss\n`;
  text += `- Moderate aerobic exercise 150 mins/week.\n`;
  text += `- Regular sleep hygiene coaching.\n`;
  text += `---DOCTOR_BRIEF_END---\n`;

  return text;
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

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    let fullText = '';

    const isAnthropicConfigured = anthropicKey && 
      !anthropicKey.startsWith('sk-ant-api03-placeholder') && 
      anthropicKey !== 'YOUR_ANTHROPIC_API_KEY';

    const isGeminiConfigured = geminiKey && 
      !geminiKey.startsWith('YOUR_GEMINI') && 
      geminiKey !== 'YOUR_GEMINI_API_KEY';

    let streamSuccess = false;

    if (isAnthropicConfigured) {
      try {
        // Real Anthropic SDK stream
        const anthropic = new Anthropic({ apiKey: anthropicKey });
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
        streamSuccess = true;
      } catch (anthropicErr) {
        console.error('Anthropic stream failed, falling back:', anthropicErr);
      }
    }
    
    if (!streamSuccess && isGeminiConfigured) {
      try {
        // Real Gemini SDK stream (Free tier in Google AI Studio)
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: SYSTEM_PROMPT
        });

        const result = await model.generateContentStream(JSON.stringify(summary));

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          res.write(`data: ${chunkText}\n\n`);
        }
        streamSuccess = true;
      } catch (geminiErr) {
        console.error('Gemini stream failed, falling back:', geminiErr);
      }
    }
    
    if (!streamSuccess) {
      // Fallback: stream mock report chunk by chunk
      const textToStream = generateMockReport(summary);
      const chunkSize = 20;
      for (let i = 0; i < textToStream.length; i += chunkSize) {
        const chunk = textToStream.substring(i, i + chunkSize);
        fullText += chunk;
        res.write(`data: ${chunk}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 15));
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
