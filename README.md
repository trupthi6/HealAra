# VitalTrack — Community Health Tracker

VitalTrack is a data-driven web application designed to help patients with chronic conditions (diabetes, hypertension, asthma) log their daily vitals, track historical trends, receive automated warnings for clinical anomalies, and securely share health logs with their doctors.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Recharts, Tailwind CSS, Axios, Lucide Icons, React Hot Toast
- **Backend:** Node.js, Express.js (REST API)
- **Database:** MongoDB, Mongoose ODM
- **Background Jobs:** node-cron (Hourly anomaly scanner)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **PDF Generation:** pdfkit (Streams weekly health summaries directly to client)

---

## 📂 Project Structure

```
vitaltrack/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── api/                   # axios instance configuration
│   │   ├── components/            # reusable UI components (Layout, Sidebar, StatCard, VitalChart, AlertBadge, MedicationCard)
│   │   ├── pages/                 # UI pages (Login, Register, Dashboard, LogHealth, Trends, Medications, Alerts, DoctorPortal)
│   │   ├── context/               # AuthContext session state
│   │   ├── hooks/                 # useNotifications 30s background poll hook
│   │   └── App.jsx                # Router table and Route guards
├── server/                        # Express backend REST API
│   ├── models/                    # Mongoose schemas (User, HealthLog, Medication, Alert, Notification)
│   ├── routes/                    # API routers (auth, logs, medications, alerts, trends, doctor, reports, notifications)
│   ├── middleware/                # JWT verification & role boundary guard middleware
│   ├── jobs/                      # node-cron automated anomaly scanners
│   ├── utils/                     # pdfkit PDF generation stream helper
│   └── index.js                   # Backend server entrypoint
├── .env                           # Local environment config
└── package.json                   # Orchestrates concurrently running backend + frontend
```

---

## 🚀 Setup & Installation Instructions

Follow these steps to run VitalTrack in development:

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** and a running **MongoDB server** (local or Atlas cloud cluster) active.

### 2. Set Up Environment Variables
We have pre-configured a default `.env` file in the root workspace folder `vitaltrack/.env`. By default, it connects to a local MongoDB instance:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/vitaltrack
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
```
If you are using MongoDB Atlas, replace `MONGODB_URI` with your connection string.

### 3. Install Dependencies
Install all package dependencies in the workspace root, backend, and frontend directories:
```bash
# In the project root (vitaltrack/):
npm install
```
*(Dependencies for the client and server are already pre-installed in the workspace).*

### 4. Seed the Database
Populate the database with test users, 30 days of randomized logs, medications, and active warnings:
```bash
npm run seed
```

### 5. Launch the Application
Start the frontend and backend servers concurrently:
```bash
npm run dev
```
- **Frontend** will be hosted at `http://localhost:5173`
- **Backend** will be running on `http://localhost:5000`

---

## 🔑 Test Credentials

Use these seed accounts to explore the features of the patient dashboard and doctor portal:

### 🧑‍⚕️ Healthcare Provider (Doctor Role)
Allows accessing the Doctor Portal workspace, selecting shared patients, reviewing log timelines, and downloading PDF summaries.
- **Email:** `doctor@vitaltrack.com`
- **Password:** `Doctor@123`

### 🤒 Patients (Patient Role)
Allows logging vitals, checking trends, checking off daily medications, viewing alerts, and downloading PDFs.

#### Patient 1 (Diabetes Condition)
- **Name:** Rahul Verma
- **Email:** `rahul@vitaltrack.com`
- **Password:** `Patient@123`
- **Condition:** Diabetes (Glucose thresholds set to max 180 mg/dL)
- **State:** Has 3 active glucose alerts triggered by high readings.

#### Patient 2 (Hypertension Condition)
- **Name:** Aisha Patel
- **Email:** `aisha@vitaltrack.com`
- **Password:** `Patient@123`
- **Condition:** Hypertension (Systolic BP thresholds set to max 135 mmHg)
- **State:** Has 3 active BP alerts.

---

## ⚡ Verified Key Features

1. **Dashboard & Metric Tracking:** Today's stats are displayed alongside a checklist of medications. The dashboard displays a Recharts LineChart of the past 7 days of glucose readings.
2. **Dynamic In-app Alerts:** Inputting values that breach customized thresholds immediately logs unresolved warnings on the alerts panel. Polling fetches notifications every 30 seconds.
3. **Doctor Workspace:** Doctors can select shared patient profiles, scroll through detailed timelines of vitals and symptom logs, and download reports.
4. **Weekly PDF Report:** Uses `pdfkit` to generate and stream PDF documents. Integrates with the Axios headers to authorize patient/doctor requests.
5. **No Crashes:** Global error boundary protections ensure that unhandled validation errors or JWT expirations result in appropriate status codes instead of crashing the process.
