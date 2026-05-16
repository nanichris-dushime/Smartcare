const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createLabTest, getLabTests, getLabTest, updateLabTest, deleteLabTest } = require('../controllers/labController');

router.post('/', authenticate, authorize(['Admin', 'Doctor', 'Laboratory Technician']), createLabTest);
router.get('/', authenticate, getLabTests);
router.get('/:id', authenticate, getLabTest);
router.put('/:id', authenticate, authorize(['Admin', 'Doctor', 'Laboratory Technician']), updateLabTest);
router.delete('/:id', authenticate, authorize(['Admin']), deleteLabTest);

module.exports = router;
