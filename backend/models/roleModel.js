const db = require('../config/db');

const Role = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM roles');
    return rows;
  }
};

module.exports = Role;
