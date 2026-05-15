const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboard } = require('../controllers/reportsController');

router.get('/dashboard', authenticate, getDashboard);

module.exports = router;
