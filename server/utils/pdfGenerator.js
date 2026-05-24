const PDFDocument = require('pdfkit');

/**
 * Generates a PDF health report for the past 7 days and streams it to the res object.
 */
function generateWeeklyReport(res, patient, logs, medications, alerts, aiAdvice = '') {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Pipe the document directly to the response
  doc.pipe(res);

  // Colors
  const primaryColor = '#0d9488'; // teal-600
  const secondaryColor = '#4b5563'; // gray-600
  const lightBg = '#f3f4f6'; // gray-100
  const borderCol = '#e5e7eb'; // gray-200
  const dangerColor = '#ef4444'; // red-500

  // 1. Header Band
  doc.rect(0, 0, 595.28, 120).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('VITALTRACK', 40, 30);
  doc.fontSize(14).font('Helvetica').text('Weekly Community Health Report', 40, 60);

  // Date Range (7 Days)
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const formatDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.fontSize(10).text(`Period: ${formatDate(sevenDaysAgo)} - ${formatDate(today)}`, 40, 85);

  // 2. Patient Profile Section
  doc.fillColor('#111827');
  doc.fontSize(14).font('Helvetica-Bold').text('Patient Information', 40, 140);
  doc.rect(40, 155, 515, 1).fill(primaryColor);

  let y = 170;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(secondaryColor).text('Name:', 40, y);
  doc.font('Helvetica').fillColor('#000000').text(patient.name, 120, y);

  doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Email:', 300, y);
  doc.font('Helvetica').fillColor('#000000').text(patient.email, 380, y);

  y += 20;
  doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Date of Birth:', 40, y);
  const dobStr = patient.dob ? new Date(patient.dob).toLocaleDateString('en-US') : 'N/A';
  doc.font('Helvetica').fillColor('#000000').text(dobStr, 120, y);

  doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Conditions:', 300, y);
  const condsStr = patient.conditions && patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None logged';
  doc.font('Helvetica').fillColor('#000000').text(condsStr, 380, y);

  // 3. Weekly Averages
  y += 35;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('Weekly Metric Averages', 40, y);
  doc.rect(40, y + 15, 515, 1).fill(primaryColor);
  y += 25;

  // Compute stats
  const validGlucose = logs.filter(l => l.vitals && l.vitals.glucose).map(l => l.vitals.glucose);
  const validSys = logs.filter(l => l.vitals && l.vitals.bpSystolic).map(l => l.vitals.bpSystolic);
  const validDia = logs.filter(l => l.vitals && l.vitals.bpDiastolic).map(l => l.vitals.bpDiastolic);
  const validHR = logs.filter(l => l.vitals && l.vitals.heartRate).map(l => l.vitals.heartRate);

  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 'N/A';

  doc.fontSize(10).font('Helvetica-Bold').fillColor(secondaryColor).text('Glucose:', 40, y);
  doc.font('Helvetica').fillColor('#000000').text(avg(validGlucose) + (validGlucose.length ? ' mg/dL' : ''), 120, y);

  doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Blood Pressure:', 300, y);
  const sysAvg = avg(validSys);
  const diaAvg = avg(validDia);
  doc.font('Helvetica').fillColor('#000000').text(sysAvg !== 'N/A' && diaAvg !== 'N/A' ? `${sysAvg}/${diaAvg} mmHg` : 'N/A', 380, y);

  y += 20;
  doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Heart Rate:', 40, y);
  doc.font('Helvetica').fillColor('#000000').text(avg(validHR) + (validHR.length ? ' bpm' : ''), 120, y);

  doc.font('Helvetica-Bold').fillColor(secondaryColor).text('Total Logs:', 300, y);
  doc.font('Helvetica').fillColor('#000000').text(logs.length.toString(), 380, y);

  // 4. Daily Logs Table
  y += 35;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('Daily Logs Grid', 40, y);
  doc.rect(40, y + 15, 515, 1).fill(primaryColor);
  y += 25;

  // Draw table header
  doc.rect(40, y, 515, 20).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Date', 45, y + 6);
  doc.text('Glucose', 105, y + 6);
  doc.text('BP (Sys/Dia)', 165, y + 6);
  doc.text('HR', 235, y + 6);
  doc.text('O2 Sat', 265, y + 6);
  doc.text('Temp', 305, y + 6);
  doc.text('Symptoms', 355, y + 6);
  y += 20;

  doc.fillColor('#000000').font('Helvetica');

  if (logs.length === 0) {
    doc.fontSize(9).text('No health logs recorded in this period.', 45, y + 8);
    y += 25;
  } else {
    logs.forEach((log, index) => {
      // Check page height limit to prevent overflow
      if (y > 700) {
        doc.addPage();
        y = 40; // reset y on new page
        // Redraw table header
        doc.rect(40, y, 515, 20).fill(primaryColor);
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('Date', 45, y + 6);
        doc.text('Glucose', 105, y + 6);
        doc.text('BP (Sys/Dia)', 165, y + 6);
        doc.text('HR', 235, y + 6);
        doc.text('O2 Sat', 265, y + 6);
        doc.text('Temp', 305, y + 6);
        doc.text('Symptoms', 355, y + 6);
        y += 20;
        doc.fillColor('#000000').font('Helvetica');
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(40, y, 515, 20).fill(lightBg);
        doc.fillColor('#000000');
      } else {
        doc.fillColor('#000000');
      }

      const logDate = new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      doc.fontSize(8);
      doc.text(logDate, 45, y + 6);
      doc.text(log.vitals?.glucose ? `${log.vitals.glucose} mg/dL` : '-', 105, y + 6);
      doc.text(log.vitals?.bpSystolic && log.vitals?.bpDiastolic ? `${log.vitals.bpSystolic}/${log.vitals.bpDiastolic}` : '-', 165, y + 6);
      doc.text(log.vitals?.heartRate ? `${log.vitals.heartRate}` : '-', 235, y + 6);
      doc.text(log.vitals?.oxygenSat ? `${log.vitals.oxygenSat}%` : '-', 265, y + 6);
      doc.text(log.vitals?.temperature ? `${log.vitals.temperature}°C` : '-', 305, y + 6);

      const symptomsStr = log.symptoms && log.symptoms.length > 0 ? log.symptoms.slice(0, 2).join(', ') : '-';
      doc.text(symptomsStr, 355, y + 6, { width: 195, height: 12, ellipsis: true });

      // Draw border bottom
      doc.rect(40, y + 19, 515, 1).fill(borderCol);

      y += 20;
    });
  }

  // Check page height again for Medications and Alerts section
  if (y > 600) {
    doc.addPage();
    y = 40;
  } else {
    y += 20;
  }

  // 5. Active Medications
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('Active Medications', 40, y);
  doc.rect(40, y + 15, 515, 1).fill(primaryColor);
  y += 25;

  doc.fontSize(9).font('Helvetica');
  if (medications.length === 0) {
    doc.text('No active medications on record.', 40, y);
    y += 20;
  } else {
    medications.forEach(med => {
      doc.font('Helvetica-Bold').text(med.name, 40, y);
      doc.font('Helvetica').text(` - Dosage: ${med.dosage || 'N/A'} | Frequency: ${med.frequency} | Reminder: ${med.reminderTime || 'N/A'}`, 130, y);
      y += 15;
    });
    y += 10;
  }

  // 6. Alert Log
  if (y > 650) {
    doc.addPage();
    y = 40;
  }

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('Clinical Alerts Triggered This Week', 40, y);
  doc.rect(40, y + 15, 515, 1).fill(primaryColor);
  y += 25;

  doc.fontSize(9).font('Helvetica');
  if (alerts.length === 0) {
    doc.text('All clear - No alerts triggered in the past 7 days.', 40, y);
    y += 15;
  } else {
    alerts.forEach(alert => {
      const alertDate = new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const severity = alert.severity || 'warning';
      doc.fillColor(severity === 'critical' ? dangerColor : '#eab308'); // yellow/red
      doc.font('Helvetica-Bold').text(`[${severity.toUpperCase()}]`, 40, y);
      doc.fillColor('#000000').font('Helvetica');
      doc.text(`${alertDate} - ${alert.message} (${alert.resolved ? 'Resolved' : 'Unresolved'})`, 100, y);
      y += 15;
    });
  }

  // 7. AI Health Coach Insights (Feature 2)
  if (aiAdvice) {
    doc.addPage();
    doc.fillColor(primaryColor).fontSize(18).font('Helvetica-Bold').text('360° AI Health Coach Insights', 40, 45);
    doc.rect(40, 65, 515, 2).fill(primaryColor);

    let aiY = 85;
    const lines = aiAdvice.split('\n');

    lines.forEach(line => {
      if (aiY > 730) {
        doc.addPage();
        aiY = 45;
      }

      const cleanLine = line.trim();
      if (cleanLine.startsWith('## ')) {
        aiY += 15;
        doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(cleanLine.substring(3), 40, aiY);
        doc.fillColor('#000000');
        aiY += 16;
      } else if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        doc.font('Helvetica').fontSize(9.5).text('• ' + cleanLine.substring(2), 50, aiY, { width: 505 });
        aiY += doc.heightOfString('• ' + cleanLine.substring(2), { width: 505 }) + 4;
      } else if (cleanLine.length > 0) {
        doc.font('Helvetica').fontSize(9.5).text(cleanLine, 40, aiY, { width: 515, lineGap: 2 });
        aiY += doc.heightOfString(cleanLine, { width: 515, lineGap: 2 }) + 8;
      }
    });
  }

  // End the document
  doc.end();
}

/**
 * Generates a Clinical Doctor Brief PDF for the physician.
 */
function generateDoctorBriefPDF(res, patient, brief, urgency, logs, medications, alerts) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  const primaryColor = '#0d9488'; // teal-600
  const secondaryColor = '#4b5563'; // gray-600
  const lightBg = '#f3f4f6'; // gray-100
  const borderCol = '#e5e7eb'; // gray-200
  const dangerColor = '#ef4444'; // red-500
  const warningColor = '#f59e0b'; // amber-500
  const successColor = '#10b981'; // green-500

  // Helper to draw border on pages
  const drawPageBorder = () => {
    doc.rect(20, 20, 555.28, 801.89).lineWidth(1).stroke(primaryColor);
  };

  // ==========================================
  // PAGE 1: COVER
  // ==========================================
  drawPageBorder();
  doc.rect(20, 20, 555.28, 15).fill(primaryColor);

  doc.fillColor('#111827').fontSize(28).font('Helvetica-Bold').text('VITALTRACK', 40, 150);
  doc.fontSize(18).fillColor(primaryColor).font('Helvetica-Bold').text('Weekly Clinical Doctor Brief', 40, 190);
  doc.rect(40, 225, 150, 4).fill(primaryColor);

  let y = 280;
  doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text('PATIENT NAME:', 40, y);
  doc.fillColor('#111827').font('Helvetica').text(patient.name, 170, y);

  y += 25;
  doc.fillColor(secondaryColor).font('Helvetica-Bold').text('AGE:', 40, y);
  let age = 'N/A';
  if (patient.dob) {
    const today = new Date();
    const birthDate = new Date(patient.dob);
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  doc.fillColor('#111827').font('Helvetica').text(age.toString(), 170, y);

  y += 25;
  doc.fillColor(secondaryColor).font('Helvetica-Bold').text('CONDITIONS:', 40, y);
  const conds = patient.conditions && patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None';
  doc.fillColor('#111827').font('Helvetica').text(conds, 170, y);

  y += 25;
  doc.fillColor(secondaryColor).font('Helvetica-Bold').text('DATE GENERATED:', 40, y);
  doc.fillColor('#111827').font('Helvetica').text(new Date().toLocaleDateString(), 170, y);

  // Urgency Badge
  y += 60;
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text('RECOMMENDED CONSULTATION URGENCY:', 40, y);

  y += 20;
  let badgeColor = successColor;
  let badgeText = 'NO IMMEDIATE ACTION NEEDED';
  if (urgency === 'urgent') {
    badgeColor = dangerColor;
    badgeText = 'URGENT (within 48 hours)';
  } else if (urgency === 'scheduled') {
    badgeColor = warningColor;
    badgeText = 'SCHEDULED (next routine appointment)';
  }

  doc.rect(40, y, 320, 30).fill(badgeColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(badgeText, 55, y + 10);

  doc.fillColor(secondaryColor).font('Helvetica-Oblique').fontSize(10)
     .text('CONFIDENTIAL — For Physician Use Only', 40, 720, { align: 'center', width: 515 });

  // ==========================================
  // PAGE 2: VITALS TABLE
  // ==========================================
  doc.addPage();
  drawPageBorder();

  doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('7-Day Complete Vitals Grid', 40, 45);
  doc.rect(40, 65, 515, 2).fill(primaryColor);

  let tableY = 85;
  doc.rect(40, tableY, 515, 20).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Date', 45, tableY + 6);
  doc.text('Glucose (mg/dL)', 115, tableY + 6);
  doc.text('BP Systolic (mmHg)', 205, tableY + 6);
  doc.text('BP Diastolic (mmHg)', 305, tableY + 6);
  doc.text('Heart Rate (bpm)', 405, tableY + 6);
  doc.text('Mood Score (/10)', 485, tableY + 6);

  tableY += 20;
  doc.fillColor('#000000').font('Helvetica');

  if (logs.length === 0) {
    doc.fontSize(9).text('No health logs recorded in this period.', 45, tableY + 8);
  } else {
    logs.forEach((log, index) => {
      if (index % 2 === 0) {
        doc.rect(40, tableY, 515, 20).fill(lightBg);
        doc.fillColor('#000000');
      } else {
        doc.fillColor('#000000');
      }
      const logDate = new Date(log.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.fontSize(8);
      doc.text(logDate, 45, tableY + 6);
      doc.text(log.vitals?.glucose ? `${log.vitals.glucose}` : '-', 115, tableY + 6);
      doc.text(log.vitals?.bpSystolic ? `${log.vitals.bpSystolic}` : '-', 205, tableY + 6);
      doc.text(log.vitals?.bpDiastolic ? `${log.vitals.bpDiastolic}` : '-', 305, tableY + 6);
      doc.text(log.vitals?.heartRate ? `${log.vitals.heartRate}` : '-', 405, tableY + 6);
      doc.text(log.moodScore !== undefined && log.moodScore !== null ? `${log.moodScore}` : '-', 485, tableY + 6);

      doc.rect(40, tableY + 19, 515, 1).fill(borderCol);
      tableY += 20;
    });
  }

  // ==========================================
  // PAGE 3: RISK FLAGS & SUMMARY
  // ==========================================
  doc.addPage();
  drawPageBorder();
  doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Clinical Summary & Risk Analysis', 40, 45);
  doc.rect(40, 65, 515, 2).fill(primaryColor);

  let sectionY = 85;
  doc.fillColor('#000000').fontSize(10).font('Helvetica');

  // Split and parse brief markdown content
  const lines = brief.split('\n');
  let currentSection = 'summary';
  let riskLines = [];
  let summaryLines = [];
  let nutritionLines = [];
  let lifestyleLines = [];
  let mentalLines = [];

  lines.forEach(line => {
    const clean = line.trim();
    if (clean.startsWith('## Clinical Summary')) {
      currentSection = 'summary';
    } else if (clean.startsWith('## Risk Flags')) {
      currentSection = 'risks';
    } else if (clean.startsWith('## Nutrition Prescriptions') || clean.startsWith('## Nutrition Checklist')) {
      currentSection = 'nutrition';
    } else if (clean.startsWith('## Lifestyle Prescriptions') || clean.startsWith('## Lifestyle Checklist')) {
      currentSection = 'lifestyle';
    } else if (clean.startsWith('## Mental Health Flag')) {
      currentSection = 'mental';
    } else if (clean.length > 0) {
      if (currentSection === 'summary') summaryLines.push(clean);
      else if (currentSection === 'risks') riskLines.push(clean);
      else if (currentSection === 'nutrition') nutritionLines.push(clean);
      else if (currentSection === 'lifestyle') lifestyleLines.push(clean);
      else if (currentSection === 'mental') mentalLines.push(clean);
    }
  });

  // Render Summary
  doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Patient Case Overview', 40, sectionY);
  sectionY += 18;
  doc.fontSize(9.5).font('Helvetica').fillColor('#000000');

  if (summaryLines.length === 0) {
    doc.text('No patient case overview summary provided.', 40, sectionY);
    sectionY += 15;
  } else {
    summaryLines.forEach(l => {
      doc.text(l, 40, sectionY, { width: 515 });
      sectionY += doc.heightOfString(l, { width: 515 }) + 6;
    });
  }

  sectionY += 15;

  // Render Risk Flags
  doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Identified Physiological Risk Flags', 40, sectionY);
  sectionY += 18;
  doc.fontSize(9.5).font('Helvetica').fillColor('#000000');

  if (riskLines.length === 0) {
    doc.text('No threshold excursions or physiological risks identified for this period.', 40, sectionY);
    sectionY += 15;
  } else {
    riskLines.forEach(l => {
      if (l.startsWith('- ') || l.startsWith('* ')) {
        doc.text('• ' + l.substring(2), 50, sectionY, { width: 505 });
        sectionY += doc.heightOfString('• ' + l.substring(2), { width: 505 }) + 5;
      } else {
        doc.text(l, 40, sectionY, { width: 515 });
        sectionY += doc.heightOfString(l, { width: 515 }) + 6;
      }
    });
  }

  // ==========================================
  // PAGE 4: NUTRITION & LIFESTYLE CHECKLISTS
  // ==========================================
  doc.addPage();
  drawPageBorder();
  doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Nutrition & Lifestyle Prescriptions Checklist', 40, 45);
  doc.rect(40, 65, 515, 2).fill(primaryColor);

  let checkY = 85;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Nutrition Checklist (Physician Review)', 40, checkY);
  checkY += 18;

  doc.fontSize(9.5).font('Helvetica').fillColor('#000000');
  if (nutritionLines.length === 0) {
    doc.text('No nutritional prescriptions checklist specified.', 40, checkY);
    checkY += 15;
  } else {
    nutritionLines.forEach(l => {
      let cleanText = l;
      if (l.startsWith('- ') || l.startsWith('* ')) {
        cleanText = l.substring(2);
      }
      doc.rect(40, checkY + 1, 8, 8).lineWidth(1).stroke('#4b5563');
      doc.text(cleanText, 55, checkY, { width: 500 });
      checkY += doc.heightOfString(cleanText, { width: 500 }) + 6;
    });
  }

  checkY += 20;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Lifestyle Checklist (Physician Review)', 40, checkY);
  checkY += 18;

  doc.fontSize(9.5).font('Helvetica').fillColor('#000000');
  if (lifestyleLines.length === 0) {
    doc.text('No lifestyle prescriptions checklist specified.', 40, checkY);
    checkY += 15;
  } else {
    lifestyleLines.forEach(l => {
      let cleanText = l;
      if (l.startsWith('- ') || l.startsWith('* ')) {
        cleanText = l.substring(2);
      }
      doc.rect(40, checkY + 1, 8, 8).lineWidth(1).stroke('#4b5563');
      doc.text(cleanText, 55, checkY, { width: 500 });
      checkY += doc.heightOfString(cleanText, { width: 500 }) + 6;
    });
  }

  // ==========================================
  // PAGE 5: MENTAL HEALTH FLAG (IF PRESENT)
  // ==========================================
  if (mentalLines.length > 0) {
    doc.addPage();
    drawPageBorder();
    doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('Mental Health & Psychological Flag', 40, 45);
    doc.rect(40, 65, 515, 2).fill(primaryColor);

    let mentalY = 85;
    doc.rect(40, mentalY, 515, 60).fill('#fef3c7'); // amber-100 background
    doc.rect(40, mentalY, 4, 60).fill('#d97706'); // amber-600 left border

    doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold').text('CLINICAL ADVISORY NOTE:', 55, mentalY + 10);
    doc.font('Helvetica').fontSize(9).text('The patient reported persistent low mood scores (<= 3) during the week.', 55, mentalY + 25);

    mentalY += 80;

    doc.fillColor('#111827').fontSize(9.5);
    mentalLines.forEach(l => {
      doc.text(l, 40, mentalY, { width: 515 });
      mentalY += doc.heightOfString(l, { width: 515 }) + 6;
    });
  }

  doc.end();
}

module.exports = {
  generateWeeklyReport,
  generateDoctorBriefPDF
};
