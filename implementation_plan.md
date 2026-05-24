# Implementation Plan — CRUD Admin Panel & AI Health Coach (Addons 1 & 2)

This plan integrates the advanced CRUD Admin Panel (Addon 1) and the AI Health Coach & PDF Reports Extension (Addon 2) into VitalTrack.

---

## Proposed Changes

### 1. Database Model Updates
- **[MODIFY] [User.js](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/models/User.js):** Extend the role enum to `['patient', 'doctor', 'admin']`.
- **[NEW] [AuditLog.js](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/models/AuditLog.js):** Schema to audit admin actions:
  ```js
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    collectionName: { type: String, required: true },
    recordId: { type: mongoose.Schema.Types.ObjectId, required: true },
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }
  ```

### 2. Database Seeding Script
- **[MODIFY] [seed.js](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/seed.js):**
  - Create the default administrator account: `admin@vitaltrack.com` / `Admin@123` (role: `admin`).
  - Pre-hash the password with `bcryptjs` before insertion.
  - Create matching `AuditLog` entries for all seeded creation records to populate the audit timeline immediately.

### 3. Backend AI Health Coach Engine
- **[NEW] [aiCoach.js (NEW)](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/utils/aiCoach.js):**
  Create a rules-based clinical expert engine that parses a patient's conditions (e.g. `'diabetes'`, `'hypertension'`), symptoms, and weekly averages (glucose, blood pressure, heart rate, mood score) to generate highly personalized recommendations across 5 dimensions:
  1. **Physical Health:** Detailed vitals analysis, anomaly flagging, risk projections (e.g., cardiovascular risks if hypertensive, glycemic fluctuations if diabetic), and 5 targeted action items.
  2. **Mental Wellness:** Mood-vital correlation analysis (e.g., high glucose leading to fatigue and low mood), adaptive recommendations (e.g., box breathing, light walking), and professional support triggers.
  3. **Nutrition Guide:** Customized menus (e.g., increasing fiber/reducing refined sugars for diabetics; reducing sodium/DASH diet items for hypertensives) and meal timing advice.
  4. **Lifestyle & Habits:** Fluid intake, sleep hygiene, screen time, and exercise recommendations tailored to symptom and mood logs.
  5. **Doctor Brief:** A concise clinical summary, endorsed prescriptions (diet/habit), critical warnings, and consultation category: `URGENT CONSULTATION` (if severe anomalies exist), `SCHEDULED VISIT` (moderate fluctuations), or `NO CONSULTATION NEEDED` (healthy/stable).
  
  The engine will output two distinct tones:
  - **Patient Tone:** Warm, plain language, encouraging, and supportive.
  - **Doctor Tone:** Brief, clinical, objective, and structured.

### 4. PDF Generation & API Extensions
- **[MODIFY] [pdfGenerator.js](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/utils/pdfGenerator.js):**
  - Support generating two report types: `patient` (featuring the warm 5-dimension AI Health Coach text) and `doctor` (serving the clinical Doctor Brief summary alongside vitals tables).
  - Add visual formatting: page borders, teal accents, bold headers, and page breaks between sections.
- **[MODIFY] [reports.js](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/routes/reports.js):**
  - Update `GET /api/reports/weekly` to take an optional `type` query parameter (`patient` or `doctor`). Verify that doctors are authorized to download briefs for shared patients.
- **[MODIFY] [admin.js](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/server/routes/admin.js):**
  - Secure routes with: `auth` → `roleCheck('admin')` → `rateLimiter` (100 req / 15 min per IP) → `express-validator` validators.
  - Expose stats showing weekly user/log deltas (`newUsersThisWeek`, `logsThisWeek`).
  - Standard CRUD endpoints for Users (with cascade deletes and yourself-delete guard), HealthLogs, Medications, Alerts, Bulk Deletes, and read-only Audit Logs.

### 5. Frontend Dashboard & Portal Updates
- **[MODIFY] [App.jsx](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/client/src/App.jsx):** Add `/admin` route under role guards, and configure redirect routes.
- **[MODIFY] [Sidebar.jsx](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/client/src/components/Sidebar.jsx):** Display the Admin Panel item using Lucide `Shield` (ti-shield) for admin users. Hide client navigation items.
- **[MODIFY] [AdminPanel.jsx](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/client/src/pages/AdminPanel.jsx):**
  - Stats card grid showing 6 cards (incorporating trend directions).
  - DataTable with checkbox row selections, paginated views, search fields, and bulk deletes.
  - Slide drawer with pre-filled forms, input validation triggers, and tag fields.
  - CSV client downloader.
  - Audit Log tab displaying trail timeline.
- **[MODIFY] [DoctorPortal.jsx](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/client/src/pages/DoctorPortal.jsx):**
  - Display the Doctor Brief clinical text under a new "AI Doctor Brief" tab.
  - Offer two separate download buttons: "Download Patient Report" (`type=patient`) and "Download Doctor Brief" (`type=doctor`).
- **[MODIFY] [Dashboard.jsx](file:///c:/Users/Trupthi/OneDrive/Documents/my%20projects%202/vitaltrack/client/src/pages/Dashboard.jsx):**
  - Stats cards showing trend arrows (up/down) comparing this week's metrics.
  - Download AI Coach Report PDF directly.

---

## Verification Plan

### Automated/Build Checks
- Run `npm install` in `server/` to configure validators.
- Compile client code using Vite.
- Run database seeder (`npm run seed`) to populate the cloud database with audit trails.

### Manual Verification
1. **Report Generation:** Log in as a patient, download the Patient Report PDF, and verify it contains sections for physical, mental, nutrition, and lifestyle recommendations tailored to your logs.
2. **Doctor Portal Brief:** Log in as a doctor, select a patient, verify that the clinical brief appears, and download the Doctor Brief PDF. Check if it matches the clinical tone.
3. **Admin Actions:** Verify Users/Logs CRUD works and writes to `/api/admin/audit-logs`.
