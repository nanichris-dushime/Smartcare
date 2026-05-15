const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const db = require('../config/db');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { username, email, password, role_name } = req.body;
    if (!username || !email || !password) return res.status(400).json({message: 'Missing fields'});

    // find role_id by name (create the role if it doesn't exist)
    const desiredRole = role_name || 'Receptionist';
    let [roleRows] = await db.query('SELECT * FROM roles WHERE role_name = ?', [desiredRole]);
    let role = roleRows[0];
    let role_id;
    if (!role) {
      // create the role and use its id
      const [insertRes] = await db.query('INSERT INTO roles (role_name) VALUES (?)', [desiredRole]);
      role_id = insertRes.insertId;
    } else {
      role_id = role.role_id;
    }

    const existing = await User.findByEmail(email);
    if (existing) return res.status(400).json({message: 'Email already registered'});

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({username, email, password: hashed, role_id});

    res.json({message: 'User registered', user});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({message: 'Missing fields'});
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({message: 'Invalid credentials'});
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({message: 'Invalid credentials'});

    // get role name
    const [roleRows] = await db.query('SELECT role_name FROM roles WHERE role_id = ?', [user.role_id]);
    const role_name = roleRows[0] ? roleRows[0].role_name : 'User';

    const payload = { user_id: user.user_id, email: user.email, role_id: user.role_id, role_name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.json({message: 'Logged in', token, user: payload});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

// seed roles endpoint - for development only
const seedRoles = async (req, res) => {
  try {
    const roles = ['Admin','Doctor','Receptionist','Pharmacist','Laboratory Technician'];
    for (const r of roles){
      await db.query('INSERT IGNORE INTO roles (role_name) VALUES (?)', [r]);
    }
    res.json({message: 'Roles seeded'});
  } catch (err){
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
}

module.exports = { register, login, seedRoles };
