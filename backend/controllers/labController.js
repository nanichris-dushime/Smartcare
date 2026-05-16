const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createLabTest = async (req, res) => {
  try {
    const { patient_id, doctor_id, test_name, test_date, cost = 0, notes } = req.body;
    if (!patient_id || !test_name) return fail(res, 'patient_id and test_name are required', null, 422);
    const [result] = await db.query(
      'INSERT INTO laboratory_tests (patient_id, doctor_id, test_name, test_date, cost, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id || null, test_name, test_date || new Date().toISOString().slice(0, 10), cost, notes || null, 'pending']
    );
    const [rows] = await db.query(
      'SELECT lt.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id LEFT JOIN doctors d ON lt.doctor_id = d.doctor_id WHERE lt.test_id = ?',
      [result.insertId]
    );
    return success(res, rows[0], 'Lab test created', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getLabTests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, patient_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(p.full_name LIKE ? OR lt.test_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (status) { where.push('lt.status = ?'); params.push(status); }
    if (patient_id) { where.push('lt.patient_id = ?'); params.push(patient_id); }
    const whereSql = where.join(' AND ');
    const [rows] = await db.query(
      `SELECT lt.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id LEFT JOIN doctors d ON lt.doctor_id = d.doctor_id WHERE ${whereSql} ORDER BY lt.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id WHERE ${whereSql}`, params
    );
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Lab tests fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getLabTest = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT lt.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id LEFT JOIN doctors d ON lt.doctor_id = d.doctor_id WHERE lt.test_id = ?',
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 'Lab test not found', null, 404);
    return success(res, rows[0], 'Lab test fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateLabTest = async (req, res) => {
  try {
    const allowed = ['test_name', 'result', 'test_date', 'status', 'cost', 'notes', 'doctor_id'];
    const fields = [];
    const values = [];
    allowed.forEach(k => { if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); } });
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    // Auto-set status to completed when result is provided
    if (req.body.result && !req.body.status) { fields.push('status = ?'); values.push('completed'); }
    values.push(req.params.id);
    await db.query(`UPDATE laboratory_tests SET ${fields.join(', ')} WHERE test_id = ?`, values);
    const [rows] = await db.query(
      'SELECT lt.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id LEFT JOIN doctors d ON lt.doctor_id = d.doctor_id WHERE lt.test_id = ?',
      [req.params.id]
    );
    return success(res, rows[0], 'Lab test updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deleteLabTest = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT test_id FROM laboratory_tests WHERE test_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Lab test not found', null, 404);
    await db.query('DELETE FROM laboratory_tests WHERE test_id = ?', [req.params.id]);
    return success(res, null, 'Lab test deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createLabTest, getLabTests, getLabTest, updateLabTest, deleteLabTest };
