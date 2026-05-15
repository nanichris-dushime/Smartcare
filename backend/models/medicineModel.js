const db = require('../config/db');

const Medicine = {
  async create({medicine_name, quantity, unit_price, expiry_date, supplier}){
    const [result] = await db.query('INSERT INTO medicines (medicine_name, quantity, unit_price, expiry_date, supplier) VALUES (?, ?, ?, ?, ?)', [medicine_name, quantity, unit_price, expiry_date, supplier]);
    return {medicine_id: result.insertId, medicine_name, quantity, unit_price, expiry_date, supplier};
  },
  async findAll(){
    const [rows] = await db.query('SELECT * FROM medicines ORDER BY medicine_name');
    return rows;
  },
  async findById(id){
    const [rows] = await db.query('SELECT * FROM medicines WHERE medicine_id = ?', [id]);
    return rows[0];
  },
  async update(id, data){
    const fields = [];
    const values = [];
    Object.keys(data).forEach(k => { fields.push(`${k} = ?`); values.push(data[k]); });
    values.push(id);
    await db.query(`UPDATE medicines SET ${fields.join(', ')} WHERE medicine_id = ?`, values);
    return this.findById(id);
  },
  async delete(id){
    await db.query('DELETE FROM medicines WHERE medicine_id = ?', [id]);
    return true;
  }
};

module.exports = Medicine;
