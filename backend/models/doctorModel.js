const db = require('../config/db');

const Doctor = {
  async create(data){
    const {full_name, specialization, email, phone, department_id} = data;
    const [result] = await db.query(
      'INSERT INTO doctors (full_name, specialization, email, phone, department_id) VALUES (?, ?, ?, ?, ?)',
      [full_name, specialization, email, phone, department_id]
    );
    return {doctor_id: result.insertId, ...data};
  },
  async findAll(){
    const [rows] = await db.query('SELECT d.*, dept.department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id ORDER BY d.created_at DESC');
    return rows;
  },
  async findById(id){
    const [rows] = await db.query('SELECT * FROM doctors WHERE doctor_id = ?', [id]);
    return rows[0];
  },
  async update(id, data){
    const fields = [];
    const values = [];
    Object.keys(data).forEach(k => { fields.push(`${k} = ?`); values.push(data[k]); });
    values.push(id);
    await db.query(`UPDATE doctors SET ${fields.join(', ')} WHERE doctor_id = ?`, values);
    return this.findById(id);
  },
  async delete(id){
    await db.query('DELETE FROM doctors WHERE doctor_id = ?', [id]);
    return true;
  }
};

module.exports = Doctor;
