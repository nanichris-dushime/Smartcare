const db = require('../config/db');

const Department = {
  async create({department_name, description}){
    const [result] = await db.query('INSERT INTO departments (department_name, description) VALUES (?, ?)', [department_name, description]);
    return {department_id: result.insertId, department_name, description};
  },
  async findAll(){
    const [rows] = await db.query('SELECT * FROM departments ORDER BY created_at DESC');
    return rows;
  },
  async findById(id){
    const [rows] = await db.query('SELECT * FROM departments WHERE department_id = ?', [id]);
    return rows[0];
  },
  async update(id, data){
    const fields = [];
    const values = [];
    Object.keys(data).forEach(k => { fields.push(`${k} = ?`); values.push(data[k]); });
    values.push(id);
    await db.query(`UPDATE departments SET ${fields.join(', ')} WHERE department_id = ?`, values);
    return this.findById(id);
  },
  async delete(id){
    await db.query('DELETE FROM departments WHERE department_id = ?', [id]);
    return true;
  }
};

module.exports = Department;
