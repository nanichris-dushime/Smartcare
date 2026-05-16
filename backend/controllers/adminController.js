const db = require('../config/db');

// Admin-only: create doctor rows for users who have the Doctor role but no doctors record
const reconcileDoctors = async (req, res) => {
  try {
    // This will insert a doctor row for each user who has role 'Doctor' and doesn't have a doctor record yet
    const sql = `
      INSERT INTO doctors (full_name, specialization, email, phone, department_id, user_id, created_at)
      SELECT u.username, '', u.email, '', NULL, u.user_id, NOW()
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_name = 'Doctor'
      AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.user_id)
    `;
    const [result] = await db.query(sql);
    res.json({ message: 'Reconciliation complete', insertedRows: result.affectedRows });
  } catch (err) {
    console.error('reconcileDoctors error:', err);
    res.status(500).json({ message: 'Server error during reconciliation' });
  }
};

module.exports = { reconcileDoctors };
