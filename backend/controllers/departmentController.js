const Department = require('../models/departmentModel');

const createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.json({message: 'Department created', dept});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getDepartments = async (req, res) => {
  try {
    const depts = await Department.findAll();
    res.json(depts);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const getDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({message: 'Not found'});
    res.json(dept);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const updateDepartment = async (req, res) => {
  try {
    const updated = await Department.update(req.params.id, req.body);
    res.json({message: 'Updated', updated});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await Department.delete(req.params.id);
    res.json({message: 'Deleted'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = { createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment };
