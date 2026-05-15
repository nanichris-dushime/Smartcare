const Patient = require('../models/patientModel');

const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.json({message: 'Patient created', patient});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({message: 'Not found'});
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const updatePatient = async (req, res) => {
  try {
    const updated = await Patient.update(req.params.id, req.body);
    res.json({message: 'Updated', updated});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const deletePatient = async (req, res) => {
  try {
    await Patient.delete(req.params.id);
    res.json({message: 'Deleted'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = { createPatient, getPatients, getPatient, updatePatient, deletePatient };
