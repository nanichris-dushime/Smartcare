const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createDoctor = async (req, res) => {
  try {
    const { full_name, specialization, email, phone, department_id, user_id, availability_status = 'available' } = req.body;
    if (!full_name) return fail(res, 'full_name is required', null, 422);
    const [result] = await db.query(
      'INSERT INTO doctors (full_name, specialization, email, phone, department_id, user_id, availability_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, specialization || null, email || null, phone || null, department_id || null, user_id || null, availability_status]
    );
    const [rows] = await db.query(
      'SELECT d.*, dept.department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id WHERE d.doctor_id = ?',
      [result.insertId]
    );
    return success(res, rows[0], 'Doctor created', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(d.full_name LIKE ? OR d.specialization LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (department_id) { where.push('d.department_id = ?'); params.push(department_id); }
    const whereSql = where.join(' AND ');
    const [rows] = await db.query(
      `SELECT d.*, dept.department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id WHERE ${whereSql} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM doctors d WHERE ${whereSql}`, params);
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Doctors fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getDoctor = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT d.*, dept.department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id WHERE d.doctor_id = ?',
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 'Doctor not found', null, 404);
    return success(res, rows[0], 'Doctor fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateDoctor = async (req, res) => {
  try {
    const allowed = ['full_name', 'specialization', 'email', 'phone', 'department_id', 'availability_status'];
    const fields = [];
    const values = [];
    allowed.forEach(k => { if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); } });
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.params.id);
    await db.query(`UPDATE doctors SET ${fields.join(', ')} WHERE doctor_id = ?`, values);
    const [rows] = await db.query(
      'SELECT d.*, dept.department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id WHERE d.doctor_id = ?',
      [req.params.id]
    );
    return success(res, rows[0], 'Doctor updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT doctor_id FROM doctors WHERE doctor_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Doctor not found', null, 404);
    await db.query('DELETE FROM doctors WHERE doctor_id = ?', [req.params.id]);
    return success(res, null, 'Doctor deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createDoctor, getDoctors, getDoctor, updateDoctor, deleteDoctor };
