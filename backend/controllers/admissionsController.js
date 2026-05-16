const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createAdmission = async (req, res) => {
  try {
    const { patient_id, doctor_id, room_number, admission_date, discharge_date, status = 'admitted', diagnosis, notes } = req.body;
    if (!patient_id || !room_number || !admission_date) return fail(res, 'patient_id, room_number, and admission_date are required', null, 422);
    const [result] = await db.query(
      'INSERT INTO admissions (patient_id, doctor_id, room_number, admission_date, discharge_date, status, diagnosis, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id || null, room_number, admission_date, discharge_date || null, status, diagnosis || null, notes || null]
    );
    const [rows] = await db.query(
      'SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM admissions a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.admission_id = ?',
      [result.insertId]
    );
    return success(res, rows[0], 'Admission created', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getAdmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, patient_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(p.full_name LIKE ? OR a.room_number LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (status) { where.push('a.status = ?'); params.push(status); }
    if (patient_id) { where.push('a.patient_id = ?'); params.push(patient_id); }
    const whereSql = where.join(' AND ');
    const [rows] = await db.query(
      `SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM admissions a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE ${whereSql} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM admissions a LEFT JOIN patients p ON a.patient_id = p.patient_id WHERE ${whereSql}`, params
    );
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Admissions fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getAdmission = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM admissions a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.admission_id = ?',
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 'Admission not found', null, 404);
    return success(res, rows[0], 'Admission fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateAdmission = async (req, res) => {
  try {
    const allowed = ['doctor_id', 'room_number', 'admission_date', 'discharge_date', 'status', 'diagnosis', 'notes'];
    const fields = [];
    const values = [];
    allowed.forEach(k => { if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); } });
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.params.id);
    await db.query(`UPDATE admissions SET ${fields.join(', ')} WHERE admission_id = ?`, values);
    const [rows] = await db.query(
      'SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM admissions a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.admission_id = ?',
      [req.params.id]
    );
    return success(res, rows[0], 'Admission updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deleteAdmission = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT admission_id FROM admissions WHERE admission_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Admission not found', null, 404);
    await db.query('DELETE FROM admissions WHERE admission_id = ?', [req.params.id]);
    return success(res, null, 'Admission deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createAdmission, getAdmissions, getAdmission, updateAdmission, deleteAdmission };
