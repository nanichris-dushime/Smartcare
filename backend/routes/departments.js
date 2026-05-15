const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

router.post('/', authenticate, authorize('Admin'), createDepartment);
router.get('/', authenticate, authorize(['Admin','Receptionist','Doctor']), getDepartments);
router.get('/:id', authenticate, authorize(['Admin','Receptionist']), getDepartment);
router.put('/:id', authenticate, authorize('Admin'), updateDepartment);
router.delete('/:id', authenticate, authorize('Admin'), deleteDepartment);

module.exports = router;
