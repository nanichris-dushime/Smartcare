const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createDepartment = async (req, res) => {
  try {
    const { department_name, description } = req.body;
    if (!department_name) return fail(res, 'department_name is required', null, 422);
    const [result] = await db.query('INSERT INTO departments (department_name, description) VALUES (?, ?)', [department_name, description || null]);
    const [rows] = await db.query('SELECT * FROM departments WHERE department_id = ?', [result.insertId]);
    return success(res, rows[0], 'Department created', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 'Department name already exists', null, 409);
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getDepartments = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const where = search ? 'WHERE department_name LIKE ?' : '';
    const params = search ? [`%${search}%`] : [];
    const [rows] = await db.query(
      `SELECT d.*, COUNT(doc.doctor_id) AS doctor_count FROM departments d LEFT JOIN doctors doc ON d.department_id = doc.department_id ${where} GROUP BY d.department_id ORDER BY d.department_name`,
      params
    );
    return success(res, rows, 'Departments fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getDepartment = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments WHERE department_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Department not found', null, 404);
    return success(res, rows[0], 'Department fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { department_name, description } = req.body;
    const fields = [];
    const values = [];
    if (department_name !== undefined) { fields.push('department_name = ?'); values.push(department_name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.params.id);
    await db.query(`UPDATE departments SET ${fields.join(', ')} WHERE department_id = ?`, values);
    const [rows] = await db.query('SELECT * FROM departments WHERE department_id = ?', [req.params.id]);
    return success(res, rows[0], 'Department updated');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 'Department name already exists', null, 409);
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT department_id FROM departments WHERE department_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Department not found', null, 404);
    await db.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
    return success(res, null, 'Department deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment };
