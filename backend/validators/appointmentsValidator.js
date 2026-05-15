const { body, query, param } = require('express-validator');

const createRules = [
  body('patient_id').isInt().withMessage('patient_id is required'),
  body('doctor_id').isInt().withMessage('doctor_id is required'),
  body('appointment_date').isISO8601().withMessage('appointment_date must be a valid date')
];

const listRules = [
  query('page').optional().isInt({min:1}).toInt(),
  query('limit').optional().isInt({min:1}).toInt(),
];

module.exports = { createRules, listRules };
