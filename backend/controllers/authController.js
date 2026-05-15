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

    // If the user is a doctor, create a doctor record linked to this user (basic profile - can be updated later)
    if (desiredRole === 'Doctor'){
      try{
        const [deptRows] = await db.query('SELECT department_id FROM departments LIMIT 1');
        const department_id = deptRows[0] ? deptRows[0].department_id : null;
        await db.query('INSERT INTO doctors (full_name, specialization, email, phone, department_id, user_id) VALUES (?, ?, ?, ?, ?, ?)', [username, '', email, '', department_id, user.user_id]);
      }catch(e){ console.warn('Could not create doctor profile:', e.message); }
    }

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
    // if doctor, fetch doctor_id
    if (role_name === 'Doctor'){
      const [docRows] = await db.query('SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1', [user.user_id]);
      if (docRows && docRows[0]) payload.doctor_id = docRows[0].doctor_id;
    }

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
