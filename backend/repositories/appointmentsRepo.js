const db = require('../config/db');

const AppointmentsRepo = {
  async create({patient_id, doctor_id, appointment_date, status='scheduled', notes=null}){
    const [res] = await db.query('INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES (?, ?, ?, ?, ?)', [patient_id, doctor_id, appointment_date, status, notes]);
    return { appointment_id: res.insertId, patient_id, doctor_id, appointment_date, status, notes };
  },
  async findById(id){
    const [rows] = await db.query('SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.appointment_id = ?', [id]);
    return rows[0];
  },
  async findAll({ page = 1, limit = 10, doctor_id, patient_id, search }){
    const offset = (page - 1) * limit;
    const where = [];
    const params = [];
    if (doctor_id){ where.push('a.doctor_id = ?'); params.push(doctor_id); }
    if (patient_id){ where.push('a.patient_id = ?'); params.push(patient_id); }
    if (search){ where.push('(p.full_name LIKE ? OR d.full_name LIKE ? OR a.status LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id ${whereSql} ORDER BY a.appointment_date DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id ${whereSql}`, params);
    return { rows, total };
  },
  async update(id, data){
    const fields = [];
    const params = [];
    Object.keys(data).forEach(k => { fields.push(`${k} = ?`); params.push(data[k]); });
    params.push(id);
    await db.query(`UPDATE appointments SET ${fields.join(', ')} WHERE appointment_id = ?`, params);
    return this.findById(id);
  },
  async delete(id){
    await db.query('DELETE FROM appointments WHERE appointment_id = ?', [id]);
    return true;
  },
  async existsConflict(doctor_id, appointment_date){
    const [rows] = await db.query('SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ?', [doctor_id, appointment_date]);
    return rows.length > 0;
  }
};

module.exports = AppointmentsRepo;
