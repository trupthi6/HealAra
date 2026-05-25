# Antigravity — Community Health Intelligence Platform

Antigravity is a data-driven health intelligence platform designed to help patients with chronic conditions (diabetes, hypertension, asthma) log their daily vitals, track historical trends with interactive charts, receive automated warnings for clinical anomalies, get AI-powered health advice, and securely share health logs with their doctors.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Recharts, Tailwind CSS, Axios, Lucide Icons, React Hot Toast
- **Backend:** Node.js, Express.js (REST API)
- **Database:** MongoDB, Mongoose ODM
- **Background Jobs:** node-cron (Hourly anomaly scanner)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **PDF Generation:** pdfkit (Streams weekly health summaries directly to client)
- **AI Advisor:** GPT-powered weekly health summaries and doctor briefs

---

## 📂 Project Structure

```
vitaltrack/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── api/                   # axios instance configuration
│   │   ├── components/            # reusable UI components (Layout, Sidebar, SplashScreen, PatientTrendsView, StatCard, VitalChart, AlertBadge, MedicationCard)
│   │   ├── pages/                 # UI pages (Login, Register, Dashboard, LogHealth, Trends, Medications, Alerts, DoctorPortal, AdminPanel, Settings, AIAdvisor)
│   │   ├── context/               # AuthContext session state
│   │   ├── hooks/                 # useNotifications 30s background poll hook
│   │   └── App.jsx                # Router table and Route guards
├── server/                        # Express backend REST API
│   ├── models/                    # Mongoose schemas (User, HealthLog, Medication, Alert, Notification, AuditLog)
│   ├── routes/                    # API routers (auth, logs, medications, alerts, trends, doctor, reports, notifications, advisor, users, admin)
│   ├── middleware/                # JWT verification & role boundary guard middleware
│   ├── jobs/                      # node-cron automated anomaly scanners
│   ├── utils/                     # pdfkit PDF generation stream helper
│   └── index.js                   # Unified server entrypoint (serves both API and frontend)
├── .env                           # Local environment config
└── package.json                   # Root package.json
```

---

## 🚀 Setup & Installation Instructions

Follow these steps to run Antigravity locally:

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** and a running **MongoDB server** (local or Atlas cloud cluster) active.

### 2. Set Up Environment Variables
Create a `.env` file in the project root with:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/vitaltrack
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
```
If you are using MongoDB Atlas, replace `MONGODB_URI` with your connection string.

### 3. Install Dependencies
Install all package dependencies:
```bash
# In the project root (vitaltrack/):
npm install

# In the client directory:
cd client && npm install
```

### 4. Seed the Database
Populate the database with test users, 30 days of randomized logs, medications, and active warnings:
```bash
npm run seed
```

### 5. Build & Launch the Application
Build the frontend and start the unified server:
```bash
cd client && npm run build && cd ..
npm start
```
The application will be available at **`http://localhost:5000`**

---

## 🔑 Test Credentials

Use these seed accounts to explore all features:

### 👨‍💼 Admin
Full platform management — user CRUD, audit logs, and system analytics.
- **Email:** `admin@antigravity.com`
- **Password:** `Admin@123`

### 🧑‍⚕️ Healthcare Provider (Doctor Role)
Access the Doctor Portal workspace — select shared patients, review log timelines, view patient trends & graphs, and download PDF summaries.
- **Email:** `doctor@antigravity.com`
- **Password:** `Doctor@123`

### 🤒 Patients (Patient Role)
Log vitals, check trends with interactive charts, manage medications, view alerts, get AI health advice, and download PDFs.

#### Patient 1 (Diabetes Condition)
- **Name:** Rahul Verma
- **Email:** `patient1@antigravity.com`
- **Password:** `Patient@123`
- **Condition:** Diabetes (Glucose thresholds set to max 180 mg/dL)
- **State:** Has 3 active glucose alerts triggered by high readings.

#### Patient 2 (Hypertension Condition)
- **Name:** Aisha Patel
- **Email:** `patient2@antigravity.com`
- **Password:** `Patient@123`
- **Condition:** Hypertension (Systolic BP thresholds set to max 135 mmHg)
- **State:** Has 3 active BP alerts.

---

## ⚡ Key Features

1. **Animated Splash Screen:** Premium orbital animation branding on app load.
2. **Dashboard & Metric Tracking:** Today's stats, medication checklist, and a 7-day glucose LineChart with urgent warning banners.
3. **Interactive Trends & Graphs:** Full-page interactive charts for glucose, blood pressure, heart rate, weight, and mood with 1W / 1M / 3M timeline selectors.
4. **Dynamic In-app Alerts:** Inputting values that breach customized thresholds immediately logs unresolved warnings. Notification polling fetches every 30 seconds.
5. **AI Health Advisor:** GPT-powered weekly health summaries with nutrition guides, lifestyle tips, mental wellness insights, and medication reminders.
6. **Doctor Workspace:** Doctors can select shared patients, scroll through detailed timelines, view patient trends & graphs, annotate notes, and download reports.
7. **Admin Panel:** Full user management (CRUD), system analytics, and audit log viewer.
8. **Settings Page:** User profile editing, threshold customization, dietary preferences, and doctor sharing management.
9. **Weekly PDF Report:** Uses `pdfkit` to generate and stream PDF health summary documents.
10. **No Crashes:** Global error boundary protections ensure unhandled errors result in appropriate status codes instead of crashing the process.
