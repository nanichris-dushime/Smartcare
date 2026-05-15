const Medicine = require('../models/medicineModel');

const createMedicine = async (req, res) => {
  try {
    const med = await Medicine.create(req.body);
    res.json({message: 'Medicine created', med});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getMedicines = async (req, res) => {
  try {
    const meds = await Medicine.findAll();
    res.json(meds);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getMedicine = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({message: 'Not found'});
    res.json(med);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const updateMedicine = async (req, res) => {
  try {
    const updated = await Medicine.update(req.params.id, req.body);
    res.json({message: 'Updated', updated});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const deleteMedicine = async (req, res) => {
  try {
    await Medicine.delete(req.params.id);
    res.json({message: 'Deleted'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = { createMedicine, getMedicines, getMedicine, updateMedicine, deleteMedicine };
