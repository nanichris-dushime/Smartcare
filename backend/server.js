const path = require('path');
// Load environment variables from backend/.env explicitly so starting from project root works.
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const app = express();
const port = process.env.PORT || 5000;

// Require JWT secret to be set in environment for security
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set JWT_SECRET.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const departmentRoutes = require('./routes/departments');
const medicineRoutes = require('./routes/medicines');
const reportsRoutes = require('./routes/reports');

app.use(cors());
app.use(express.json());

// Serve frontend static files (so requests like /frontend/appointments.html work)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use('/frontend', express.static(frontendPath));
console.log(`Serving frontend from ${frontendPath}`);

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/', (req, res) => {
  res.send({message: 'SmartCare Hospital API'});
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({error: 'Something went wrong'});
});

// Seed roles at startup if not present (development convenience)
async function seedRoles(){
  try{
    const roles = ['Admin','Doctor','Receptionist','Pharmacist','Laboratory Technician'];
    for (const r of roles){
      const [rows] = await db.query('SELECT role_id FROM roles WHERE role_name = ?', [r]);
      if (!rows || rows.length === 0){
        await db.query('INSERT INTO roles (role_name) VALUES (?)', [r]);
        console.log(`Inserted role: ${r}`);
      }
    }
  }catch(err){
    console.warn('Could not seed roles:', err.message);
  }
}

// Create a default admin user if none exists (development only)
async function seedAdmin(){
  try{
    const [rows] = await db.query("SELECT u.* FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'Admin' LIMIT 1");
    if (!rows || rows.length === 0){
      const username = process.env.DEFAULT_ADMIN_USER || 'admin';
      const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

      // get admin role id
      const [roleRows] = await db.query('SELECT role_id FROM roles WHERE role_name = ?', ['Admin']);
      const role_id = roleRows[0] ? roleRows[0].role_id : null;
      if (!role_id) return console.warn('No Admin role_id found; skipping admin seed');

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      await db.query('INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)', [username, email, hashed, role_id]);
      console.log(`Inserted default admin user: ${email} (password: ${password})`);
    }
  }catch(err){
    console.warn('Could not seed admin user:', err.message);
  }
}

async function init(){
  await seedRoles();
  await seedAdmin();
  app.listen(port, () => {
    console.log(`Server running on port  ${port}`);
  });
}

init();
