const path = require('path');
// Load environment variables from parent folder relative to this directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const logsRoutes = require('./routes/logs');
const medicationsRoutes = require('./routes/medications');
const alertsRoutes = require('./routes/alerts');
const trendsRoutes = require('./routes/trends');
const doctorRoutes = require('./routes/doctor');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const advisorRoutes = require('./routes/advisor');
const usersRoutes = require('./routes/users');

// Import job to initialize the cron schedules
require('./jobs/anomalyDetector');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/users', usersRoutes);

// Serve static assets from React client build folder
app.use(express.static(path.resolve(__dirname, '../client/dist')));

// Wildcard fallback to serve index.html for React Router client-side routing
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vitaltrack';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB successfully connected.');
    // Start listening once DB connects
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

// Handle Uncaught Exceptions & Unhandled Rejections to prevent server crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Promise Rejection] Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception] Error:', error);
});
