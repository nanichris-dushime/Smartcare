const express = require('express');
const router = express.Router();
const { register, login, seedRoles } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/seed-roles', seedRoles);

module.exports = router;
