const db = require('../config/db');

const User = {
  async create({username, email, password, role_id}){
    const [result] = await db.query('INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)', [username, email, password, role_id]);
    return {user_id: result.insertId, username, email, role_id};
  },
  async findByEmail(email){
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  async findById(id){
    const [rows] = await db.query('SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE user_id = ?', [id]);
    return rows[0];
  }
};

module.exports = User;
