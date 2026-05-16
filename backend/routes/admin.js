const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { reconcileDoctors } = require('../controllers/adminController');

// POST /api/admin/reconcile-doctors
router.post('/reconcile-doctors', authenticate, authorize('Admin'), reconcileDoctors);

module.exports = router;
