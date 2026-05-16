const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createPayment, getPayments, getPayment, deletePayment } = require('../controllers/paymentsController');

router.post('/', authenticate, authorize(['Admin', 'Receptionist']), createPayment);
router.get('/', authenticate, authorize(['Admin', 'Receptionist']), getPayments);
router.get('/:id', authenticate, authorize(['Admin', 'Receptionist']), getPayment);
router.delete('/:id', authenticate, authorize(['Admin']), deletePayment);

module.exports = router;
