const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createPayment = async (req, res) => {
  try {
    const { bill_id, amount_paid, payment_method = 'cash', payment_date, notes } = req.body;
    if (!bill_id || !amount_paid) return fail(res, 'bill_id and amount_paid are required', null, 422);
    const [billRows] = await db.query('SELECT * FROM bills WHERE bill_id = ?', [bill_id]);
    if (!billRows[0]) return fail(res, 'Bill not found', null, 404);
    const [result] = await db.query(
      'INSERT INTO payments (bill_id, amount_paid, payment_method, payment_date, notes) VALUES (?, ?, ?, ?, ?)',
      [bill_id, amount_paid, payment_method, payment_date || new Date().toISOString().slice(0, 10), notes || null]
    );
    // Update bill status based on total paid
    const [[{ total_paid }]] = await db.query('SELECT IFNULL(SUM(amount_paid),0) AS total_paid FROM payments WHERE bill_id = ?', [bill_id]);
    const bill = billRows[0];
    let newStatus = 'partial';
    if (parseFloat(total_paid) >= parseFloat(bill.total_amount) - parseFloat(bill.discount || 0)) newStatus = 'paid';
    await db.query('UPDATE bills SET bill_status = ? WHERE bill_id = ?', [newStatus, bill_id]);
    const [rows] = await db.query('SELECT * FROM payments WHERE payment_id = ?', [result.insertId]);
    return success(res, rows[0], 'Payment recorded', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, bill_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = bill_id ? 'WHERE p.bill_id = ?' : '';
    const params = bill_id ? [bill_id] : [];
    const [rows] = await db.query(
      `SELECT p.*, b.total_amount, b.bill_status, pt.full_name AS patient_name FROM payments p LEFT JOIN bills b ON p.bill_id = b.bill_id LEFT JOIN patients pt ON b.patient_id = pt.patient_id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM payments p ${where}`, params);
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Payments fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getPayment = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, b.total_amount, b.bill_status, pt.full_name AS patient_name FROM payments p LEFT JOIN bills b ON p.bill_id = b.bill_id LEFT JOIN patients pt ON b.patient_id = pt.patient_id WHERE p.payment_id = ?',
      [req.params.id]
    );
    if (!rows[0]) return fail(res, 'Payment not found', null, 404);
    return success(res, rows[0], 'Payment fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deletePayment = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payments WHERE payment_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Payment not found', null, 404);
    await db.query('DELETE FROM payments WHERE payment_id = ?', [req.params.id]);
    // Recalculate bill status
    const [[{ total_paid }]] = await db.query('SELECT IFNULL(SUM(amount_paid),0) AS total_paid FROM payments WHERE bill_id = ?', [rows[0].bill_id]);
    const [[bill]] = await db.query('SELECT total_amount, discount FROM bills WHERE bill_id = ?', [rows[0].bill_id]);
    if (bill) {
      let newStatus = total_paid <= 0 ? 'pending' : parseFloat(total_paid) >= parseFloat(bill.total_amount) - parseFloat(bill.discount || 0) ? 'paid' : 'partial';
      await db.query('UPDATE bills SET bill_status = ? WHERE bill_id = ?', [newStatus, rows[0].bill_id]);
    }
    return success(res, null, 'Payment deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createPayment, getPayments, getPayment, deletePayment };
