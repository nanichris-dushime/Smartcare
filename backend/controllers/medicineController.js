const db = require('../config/db');
const { success, fail } = require('../utils/response');

const createMedicine = async (req, res) => {
  try {
    const { medicine_name, quantity, unit_price, expiry_date, supplier, category, low_stock_threshold = 10 } = req.body;
    if (!medicine_name) return fail(res, 'medicine_name is required', null, 422);
    const [result] = await db.query(
      'INSERT INTO medicines (medicine_name, quantity, unit_price, expiry_date, supplier, category, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [medicine_name, quantity || 0, unit_price || 0, expiry_date || null, supplier || null, category || null, low_stock_threshold]
    );
    const [rows] = await db.query('SELECT * FROM medicines WHERE medicine_id = ?', [result.insertId]);
    return success(res, rows[0], 'Medicine created', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category, low_stock } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = ['1=1'];
    const params = [];
    if (search) { where.push('(medicine_name LIKE ? OR supplier LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (category) { where.push('category = ?'); params.push(category); }
    if (low_stock === 'true') { where.push('quantity <= low_stock_threshold'); }
    const whereSql = where.join(' AND ');
    const [rows] = await db.query(`SELECT * FROM medicines WHERE ${whereSql} ORDER BY medicine_name LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM medicines WHERE ${whereSql}`, params);
    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) }, 'Medicines fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getMedicine = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medicines WHERE medicine_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Medicine not found', null, 404);
    return success(res, rows[0], 'Medicine fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateMedicine = async (req, res) => {
  try {
    const allowed = ['medicine_name', 'quantity', 'unit_price', 'expiry_date', 'supplier', 'category', 'low_stock_threshold'];
    const fields = [];
    const values = [];
    allowed.forEach(k => { if (req.body[k] !== undefined) { fields.push(`${k} = ?`); values.push(req.body[k]); } });
    if (!fields.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.params.id);
    await db.query(`UPDATE medicines SET ${fields.join(', ')} WHERE medicine_id = ?`, values);
    const [rows] = await db.query('SELECT * FROM medicines WHERE medicine_id = ?', [req.params.id]);
    return success(res, rows[0], 'Medicine updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT medicine_id FROM medicines WHERE medicine_id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 'Medicine not found', null, 404);
    await db.query('DELETE FROM medicines WHERE medicine_id = ?', [req.params.id]);
    return success(res, null, 'Medicine deleted');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { createMedicine, getMedicines, getMedicine, updateMedicine, deleteMedicine };
