const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getDashboard, getRevenueReport, getAppointmentReport } = require('../controllers/reportsController');

router.get('/dashboard', authenticate, getDashboard);
router.get('/revenue', authenticate, authorize(['Admin']), getRevenueReport);
router.get('/appointments', authenticate, authorize(['Admin', 'Receptionist']), getAppointmentReport);

module.exports = router;
