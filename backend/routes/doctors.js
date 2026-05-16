const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createDoctor, getDoctors, getDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');

router.post('/', authenticate, authorize(['Admin']), createDoctor);
router.get('/', authenticate, getDoctors);
router.get('/:id', authenticate, getDoctor);
router.put('/:id', authenticate, authorize(['Admin']), updateDoctor);
router.delete('/:id', authenticate, authorize(['Admin']), deleteDoctor);

module.exports = router;
