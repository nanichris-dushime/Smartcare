const db = require('../config/db');

const Patient = {
  async create(data){
    const {full_name, gender, date_of_birth, phone, email, address, blood_group} = data;
    const [result] = await db.query(
      'INSERT INTO patients (full_name, gender, date_of_birth, phone, email, address, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, gender, date_of_birth, phone, email, address, blood_group]
    );
    return {patient_id: result.insertId, ...data};
  },
  async findAll(){
    const [rows] = await db.query('SELECT * FROM patients ORDER BY created_at DESC');
    return rows;
  },
  async findById(id){
    const [rows] = await db.query('SELECT * FROM patients WHERE patient_id = ?', [id]);
    return rows[0];
  },
  async update(id, data){
    const fields = [];
    const values = [];
    Object.keys(data).forEach(k => { fields.push(`${k} = ?`); values.push(data[k]); });
    values.push(id);
    await db.query(`UPDATE patients SET ${fields.join(', ')} WHERE patient_id = ?`, values);
    return this.findById(id);
  },
  async delete(id){
    await db.query('DELETE FROM patients WHERE patient_id = ?', [id]);
    return true;
  }
};

module.exports = Patient;
