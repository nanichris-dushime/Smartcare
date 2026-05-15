const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createDoctor, getDoctors, getDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');

router.post('/', authenticate, authorize(['Admin']), createDoctor);
router.get('/', authenticate, authorize(['Admin','Doctor','Receptionist']), getDoctors);
router.get('/:id', authenticate, authorize(['Admin','Doctor']), getDoctor);
router.put('/:id', authenticate, authorize(['Admin']), updateDoctor);
router.delete('/:id', authenticate, authorize('Admin'), deleteDoctor);

module.exports = router;
