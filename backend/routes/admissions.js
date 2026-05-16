const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createAdmission, getAdmissions, getAdmission, updateAdmission, deleteAdmission } = require('../controllers/admissionsController');

router.post('/', authenticate, authorize(['Admin', 'Receptionist', 'Doctor']), createAdmission);
router.get('/', authenticate, getAdmissions);
router.get('/:id', authenticate, getAdmission);
router.put('/:id', authenticate, authorize(['Admin', 'Receptionist', 'Doctor']), updateAdmission);
router.delete('/:id', authenticate, authorize(['Admin']), deleteAdmission);

module.exports = router;
