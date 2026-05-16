const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createBill = async (req, res) => {
  try {
    const { patient_id, appointment_id, admission_id, total_amount, discount = 0, description, bill_status = 'pending', bill_date } = req.body;
    if (!patient_id || !total_amount) return fail(res, 'patient_id and total_amount are required', null, 422);
    const [result] = await db.query(
      'INSERT INTO bills (patient_id, appointment_id, admission_id, total_amount, discount, description, bill_status, bill_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, appointment_id || null, admission_id || null, total_amount, discount, description || null, bill_status, bill_date || new Date().toISOString().slice(0, 10)]
    );
    const [rows] = await db.query('SELECT b.*, p.full_name AS patient_name FROM bills b LEFT JOIN patients p ON b.patient_id = p.patient_id WHERE b.bill_id = ?', [result.insertId]);
    return success(res, rows[0], 'Bill created', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, patient_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(p.full_name LIKE ? OR b.bill_id LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (status) { where.push('b.bill_status = ?'); params.push(status); }
    if (patient_id) { where.push('b.patient_id = ?'); params.push(patient_id); }
    const whereSql = where.join(' AND ');
    const [rows] = await db.query(
      `SELECT b.*, p.full_name AS patient_name FROM bills b LEFT JOIN patients p ON b.patient_id = p.patient_id WHERE ${whereSql} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bills b LEFT JOIN patients p ON b.patient_id = p.patient_id WHERE ${whereSql}`, params);
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Bills fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getBill = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT b.*, p.full_name AS patient_name FROM bills b LEFT JOIN patients p ON b.patient_id = p.patient_id WHERE b.bill_id = ?',
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 'Bill not found', null, 404);
    const [payments] = await db.query('SELECT * FROM payments WHERE bill_id = ? ORDER BY payment_date DESC', [req.params.id]);
    return success(res, { ...rows[0], payments }, 'Bill fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateBill = async (req, res) => {
  try {
    const allowed = ['total_amount', 'discount', 'description', 'bill_status', 'bill_date'];
    const fields = [];
    const values = [];
    allowed.forEach(k => { if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); } });
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.params.id);
    await db.query(`UPDATE bills SET ${fields.join(', ')} WHERE bill_id = ?`, values);
    const [rows] = await db.query('SELECT b.*, p.full_name AS patient_name FROM bills b LEFT JOIN patients p ON b.patient_id = p.patient_id WHERE b.bill_id = ?', [req.params.id]);
    return success(res, rows[0], 'Bill updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deleteBill = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT bill_id FROM bills WHERE bill_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Bill not found', null, 404);
    await db.query('DELETE FROM bills WHERE bill_id = ?', [req.params.id]);
    return success(res, null, 'Bill deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createBill, getBills, getBill, updateBill, deleteBill };
