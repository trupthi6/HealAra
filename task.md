# Task List — Feature Addon 1 (CRUD Admin Panel)

- [x] Modify User Database Model
  - [x] Add `admin` role to `User.js` enum
- [x] Update Database Seeding Script
  - [x] Add admin user to `seed.js`
- [x] Implement Backend Admin Routes (`server/routes/admin.js`)
  - [x] GET `/api/admin/stats` (users, logs, medications, alerts counts)
  - [x] CRUD Users (`/users`)
  - [x] CRUD Health Logs (`/logs`)
  - [x] CRUD Medications (`/medications`)
  - [x] CRUD Alerts (`/alerts`)
  - [x] Register new router in `server/index.js`
- [x] Implement Frontend Components & Routing
  - [x] Update `App.jsx` with `/admin` route and redirect selectors
  - [x] Update `Sidebar.jsx` with Admin Panel navigation item
  - [x] Implement `AdminPanel.jsx` page
    - [x] Create header stats cards
    - [x] Implement collection tab switcher
    - [x] Create DataTable component with search and pagination
    - [x] Implement slide-in drawer for Edit/Create forms
    - [x] Create form elements for Users, Logs, Medications, and Alerts
- [x] Verification and Testing
  - [x] Run seeder and check admin authentication
  - [x] Test CRUD operations on all collections via UI
  - [x] Verify cascade deletes (users -> logs, meds, alerts)

# Task List — Feature Addon 2 (360° AI Health Coach)

- [x] Modify User Database Model for Coach Attributes
  - [x] Add `aiAdvice`, `aiDoctorBrief`, `aiAdviceGeneratedAt`, `sharedAiAdvice`, `consultationUrgency`, `doctorAnnotation`, `doctorAnnotationBy`, `prevDoctorAnnotation`, `dietaryPreferences` fields to `User.js`
- [x] Implement AI Coach Generation Engine (`server/utils/aiCoach.js`)
  - [x] Build patient weekly logs summarizer
  - [x] Add streaming Claude Sonnet model integrations
  - [x] Handle Patient Report split blocks and Doctor Brief parsing
  - [x] Set up database advice cache writes
- [x] Implement Dual PDF Exporters (`server/utils/pdfGenerator.js`)
  - [x] Implement `generateDoctorBriefPDF` featuring cover sheet, urgency badges, complete logs grid table, and checkboxes
  - [x] Update `generateWeeklyReport` for markdown parsing of AI advice
- [x] Add Frontend and Route Integrations
  - [x] Build settings multi-select tags menu for dietary preferences
  - [x] Update doctor portal workspace UI tabs (AI Doctor Brief checklist, note annotation text field, dual download actions)
  - [x] Update dashboard page (urgent banners, trends indicator flags)
  - [x] Verify production compilation builds successfully

# Task List — Feature Addon 3 (Doctor Trends & Graphs View)

- [x] Refactor Trends Component to be Reusable
  - [x] Extract patient analytics visualization to `PatientTrendsView.jsx` accepting `patientId` and `thresholds`
  - [x] Update `Trends.jsx` to render `PatientTrendsView` for the logged-in patient
- [x] Integrate Trends & Graphs in Doctor Portal
  - [x] Add "Trends & Graphs" tab button and pane in `DoctorPortal.jsx`
  - [x] Render `PatientTrendsView` in the doctor portal passing `selectedPatientId` and `thresholds`
- [x] Fix Backend Authorization for Trends
  - [x] Resolve Mongoose ObjectId comparison bug in `server/routes/trends.js` using `.map(id => id.toString()).includes(req.user._id.toString())` to authorize doctors viewing shared patients
- [x] Verification and Rebuild
  - [x] Rebuild client application via `npm run build`
  - [x] Verify charts and statistics for all 5 parameters (glucose, blood pressure, heart rate, weight, mood)


