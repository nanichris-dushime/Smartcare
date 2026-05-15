const Doctor = require('../models/doctorModel');

const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.json({message: 'Doctor created', doctor});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll();
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({message: 'Not found'});
    res.json(doctor);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const updateDoctor = async (req, res) => {
  try {
    const updated = await Doctor.update(req.params.id, req.body);
    res.json({message: 'Updated', updated});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const deleteDoctor = async (req, res) => {
  try {
    await Doctor.delete(req.params.id);
    res.json({message: 'Deleted'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = { createDoctor, getDoctors, getDoctor, updateDoctor, deleteDoctor };
