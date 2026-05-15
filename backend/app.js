const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// Security headers
app.use(helmet());

// Logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 120 }); // 120 requests per minute
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use('/frontend', express.static(frontendPath));

// Routes (keep existing routes centralized)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/appointments', require('./routes/appointments'));

// Default root
app.get('/', (req, res) => res.json({ message: 'SmartCare Hospital API' }));

// Global error handler will be attached in server.js after app is created

module.exports = app;
