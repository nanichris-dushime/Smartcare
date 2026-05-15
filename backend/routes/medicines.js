const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createMedicine, getMedicines, getMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicineController');

router.post('/', authenticate, authorize(['Admin','Pharmacist']), createMedicine);
router.get('/', authenticate, authorize(['Admin','Pharmacist','Receptionist']), getMedicines);
router.get('/:id', authenticate, authorize(['Admin','Pharmacist']), getMedicine);
router.put('/:id', authenticate, authorize(['Admin','Pharmacist']), updateMedicine);
router.delete('/:id', authenticate, authorize('Admin'), deleteMedicine);

module.exports = router;
