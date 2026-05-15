const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createAppointment, listAppointments, getAppointment, updateAppointment, deleteAppointment } = require('../controllers/appointmentsController');
const { createRules, listRules } = require('../validators/appointmentsValidator');
const { validationResult } = require('express-validator');

function handleValidation(req, res, next){
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success:false, message: 'Validation failed', errors: errors.array() });
  next();
}

router.post('/', authenticate, authorize(['Admin','Receptionist']), createRules, handleValidation, createAppointment);
router.get('/', authenticate, authorize(['Admin','Receptionist','Doctor']), listRules, handleValidation, listAppointments);
router.get('/:id', authenticate, authorize(['Admin','Receptionist','Doctor']), getAppointment);
router.put('/:id', authenticate, authorize(['Admin','Receptionist']), updateAppointment);
router.delete('/:id', authenticate, authorize('Admin'), deleteAppointment);

module.exports = router;
