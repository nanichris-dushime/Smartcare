require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

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

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});
