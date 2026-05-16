const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createPatient = async (req, res) => {
  try {
    const { full_name, gender, date_of_birth, phone, email, address, blood_group, emergency_contact, emergency_phone } = req.body;
    if (!full_name) return fail(res, 'full_name is required', null, 422);
    const [result] = await db.query(
      'INSERT INTO patients (full_name, gender, date_of_birth, phone, email, address, blood_group, emergency_contact, emergency_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name, gender || null, date_of_birth || null, phone || null, email || null, address || null, blood_group || null, emergency_contact || null, emergency_phone || null]
    );
    const [rows] = await db.query('SELECT * FROM patients WHERE patient_id = ?', [result.insertId]);
    return success(res, rows[0], 'Patient created', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? 'WHERE (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)' : '';
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const [rows] = await db.query(`SELECT * FROM patients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM patients ${where}`, params);
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Patients fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getPatient = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients WHERE patient_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Patient not found', null, 404);
    return success(res, rows[0], 'Patient fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updatePatient = async (req, res) => {
  try {
    const allowed = ['full_name', 'gender', 'date_of_birth', 'phone', 'email', 'address', 'blood_group', 'emergency_contact', 'emergency_phone'];
    const fields = [];
    const values = [];
    allowed.forEach(k => { if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); } });
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.params.id);
    await db.query(`UPDATE patients SET ${fields.join(', ')} WHERE patient_id = ?`, values);
    const [rows] = await db.query('SELECT * FROM patients WHERE patient_id = ?', [req.params.id]);
    return success(res, rows[0], 'Patient updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deletePatient = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT patient_id FROM patients WHERE patient_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Patient not found', null, 404);
    await db.query('DELETE FROM patients WHERE patient_id = ?', [req.params.id]);
    return success(res, null, 'Patient deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createPatient, getPatients, getPatient, updatePatient, deletePatient };
