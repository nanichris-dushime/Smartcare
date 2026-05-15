const path = require('path');
// Load environment variables from backend/.env explicitly so starting from project root works.
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
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

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medicines', medicineRoutes);

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

async function init(){
  await seedRoles();
  app.listen(port, () => {
    console.log(`Server running on port  ${port}`);
  });
}

init();
