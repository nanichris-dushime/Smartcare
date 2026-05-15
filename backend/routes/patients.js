const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createPatient, getPatients, getPatient, updatePatient, deletePatient } = require('../controllers/patientController');

router.post('/', authenticate, authorize(['Admin','Receptionist','Doctor']), createPatient);
router.get('/', authenticate, authorize(['Admin','Receptionist','Doctor','Pharmacist','Laboratory Technician']), getPatients);
router.get('/:id', authenticate, authorize(['Admin','Receptionist','Doctor']), getPatient);
router.put('/:id', authenticate, authorize(['Admin','Receptionist','Doctor']), updatePatient);
router.delete('/:id', authenticate, authorize('Admin'), deletePatient);

module.exports = router;
