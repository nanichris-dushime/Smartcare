const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createBill, getBills, getBill, updateBill, deleteBill } = require('../controllers/billsController');

router.post('/', authenticate, authorize(['Admin', 'Receptionist']), createBill);
router.get('/', authenticate, authorize(['Admin', 'Receptionist']), getBills);
router.get('/:id', authenticate, authorize(['Admin', 'Receptionist']), getBill);
router.put('/:id', authenticate, authorize(['Admin', 'Receptionist']), updateBill);
router.delete('/:id', authenticate, authorize(['Admin']), deleteBill);

module.exports = router;
