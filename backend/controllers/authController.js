const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { success, fail } = require('../utils/response');

const generateTokens = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ user_id: payload.user_id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '7d' });
  return { token, refreshToken };
};

const register = async (req, res) => {
  try {
    const { username, email, password, role_name } = req.body;
    if (!username || !email || !password) return fail(res, 'username, email, and password are required', null, 422);
    if (password.length < 6) return fail(res, 'Password must be at least 6 characters', null, 422);

    const [existingRows] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingRows[0]) return fail(res, 'Email already registered', null, 409);

    const desiredRole = role_name || 'Receptionist';
    const [roleRows] = await db.query('SELECT role_id FROM roles WHERE role_name = ?', [desiredRole]);
    if (!roleRows[0]) return fail(res, `Role '${desiredRole}' not found`, null, 400);
    const role_id = roleRows[0].role_id;

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)',
      [username, email, hashed, role_id]
    );

    if (desiredRole === 'Doctor') {
      try {
        const [deptRows] = await db.query('SELECT department_id FROM departments LIMIT 1');
        const department_id = deptRows[0] ? deptRows[0].department_id : null;
        await db.query(
          'INSERT INTO doctors (full_name, specialization, email, phone, department_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
          [username, '', email, '', department_id, result.insertId]
        );
      } catch (e) { console.warn('Could not create doctor profile:', e.message); }
    }

    return success(res, { user_id: result.insertId, username, email, role_name: desiredRole }, 'User registered successfully', 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password are required', null, 422);

    const [userRows] = await db.query(
      'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.email = ?',
      [email]
    );
    const user = userRows[0];
    if (!user) return fail(res, 'Invalid credentials', null, 401);
    if (user.is_active === 0) return fail(res, 'Account is deactivated', null, 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return fail(res, 'Invalid credentials', null, 401);

    const payload = { user_id: user.user_id, username: user.username, email: user.email, role_id: user.role_id, role_name: user.role_name };

    if (user.role_name === 'Doctor') {
      const [docRows] = await db.query('SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1', [user.user_id]);
      if (docRows[0]) payload.doctor_id = docRows[0].doctor_id;
    }

    const { token, refreshToken } = generateTokens(payload);
    await db.query('UPDATE users SET refresh_token = ?, last_login = NOW() WHERE user_id = ?', [refreshToken, user.user_id]);

    res.cookie('sc_refresh', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return success(res, { token, user: payload }, 'Login successful');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.sc_refresh || req.body?.refreshToken;
    if (!refreshToken) return fail(res, 'Refresh token required', null, 401);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    } catch {
      return fail(res, 'Invalid or expired refresh token', null, 401);
    }

    const [userRows] = await db.query(
      'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ? AND u.refresh_token = ?',
      [decoded.user_id, refreshToken]
    );
    if (!userRows[0]) return fail(res, 'Refresh token revoked', null, 401);

    const user = userRows[0];
    const payload = { user_id: user.user_id, username: user.username, email: user.email, role_id: user.role_id, role_name: user.role_name };
    if (user.role_name === 'Doctor') {
      const [docRows] = await db.query('SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1', [user.user_id]);
      if (docRows[0]) payload.doctor_id = docRows[0].doctor_id;
    }

    const { token, refreshToken: newRefresh } = generateTokens(payload);
    await db.query('UPDATE users SET refresh_token = ? WHERE user_id = ?', [newRefresh, user.user_id]);
    res.cookie('sc_refresh', newRefresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return success(res, { token, user: payload }, 'Token refreshed');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await db.query('UPDATE users SET refresh_token = NULL WHERE user_id = ?', [req.user.user_id]);
    }
    res.clearCookie('sc_refresh');
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT u.user_id, u.username, u.email, u.created_at, u.last_login, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?',
      [req.user.user_id]
    );
    if (!rows[0]) return fail(res, 'User not found', null, 404);
    return success(res, rows[0], 'Profile fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, current_password, new_password } = req.body;
    const updates = [];
    const values = [];

    if (username) { updates.push('username = ?'); values.push(username); }

    if (new_password) {
      if (!current_password) return fail(res, 'current_password is required to change password', null, 422);
      if (new_password.length < 6) return fail(res, 'New password must be at least 6 characters', null, 422);
      const [rows] = await db.query('SELECT password FROM users WHERE user_id = ?', [req.user.user_id]);
      const match = await bcrypt.compare(current_password, rows[0].password);
      if (!match) return fail(res, 'Current password is incorrect', null, 400);
      updates.push('password = ?');
      values.push(await bcrypt.hash(new_password, 12));
    }

    if (!updates.length) return fail(res, 'No valid fields to update', null, 422);
    values.push(req.user.user_id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
    return success(res, null, 'Profile updated');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { register, login, refresh, logout, getProfile, updateProfile };
