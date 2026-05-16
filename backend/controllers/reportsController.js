const db = require('../config/db');
const { success, fail } = require('../utils/response');

const getDashboard = async (req, res) => {
  try {
    const role = req.user.role_name;

    const [[{ totalPatients }]] = await db.query('SELECT COUNT(*) AS totalPatients FROM patients');
    const [[{ totalDoctors }]] = await db.query('SELECT COUNT(*) AS totalDoctors FROM doctors');
    const [[{ totalAppointments }]] = await db.query('SELECT COUNT(*) AS totalAppointments FROM appointments');
    const [[{ totalRevenue }]] = await db.query("SELECT IFNULL(SUM(amount_paid),0) AS totalRevenue FROM payments");
    const [[{ todayAppointments }]] = await db.query("SELECT COUNT(*) AS todayAppointments FROM appointments WHERE DATE(appointment_date) = CURDATE()");
    const [[{ pendingBills }]] = await db.query("SELECT COUNT(*) AS pendingBills FROM bills WHERE bill_status IN ('pending','partial')");
    const [[{ activeAdmissions }]] = await db.query("SELECT COUNT(*) AS activeAdmissions FROM admissions WHERE status = 'admitted'");
    const [[{ lowStockCount }]] = await db.query("SELECT COUNT(*) AS lowStockCount FROM medicines WHERE quantity <= low_stock_threshold");

    const result = { totalPatients, totalDoctors, totalAppointments, totalRevenue, todayAppointments, pendingBills, activeAdmissions, lowStockCount };

    // Monthly revenue (last 6 months)
    const [monthlyRevenue] = await db.query(
      "SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month, IFNULL(SUM(amount_paid),0) AS revenue FROM payments WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY month ORDER BY month ASC"
    );
    result.monthlyRevenue = monthlyRevenue;

    // Monthly appointments (last 6 months)
    const [monthlyAppointments] = await db.query(
      "SELECT DATE_FORMAT(appointment_date,'%Y-%m') AS month, COUNT(*) AS count FROM appointments WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY month ORDER BY month ASC"
    );
    result.monthlyAppointments = monthlyAppointments;

    if (role === 'Admin') {
      const [recentAppointments] = await db.query(
        'SELECT a.appointment_id, a.appointment_date, a.status, p.full_name AS patient_name, d.full_name AS doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id ORDER BY a.appointment_date DESC LIMIT 8'
      );
      const [recentPayments] = await db.query(
        'SELECT py.*, b.total_amount, pt.full_name AS patient_name FROM payments py LEFT JOIN bills b ON py.bill_id = b.bill_id LEFT JOIN patients pt ON b.patient_id = pt.patient_id ORDER BY py.created_at DESC LIMIT 6'
      );
      const [lowStock] = await db.query('SELECT * FROM medicines WHERE quantity <= low_stock_threshold ORDER BY quantity ASC LIMIT 8');
      const [deptStats] = await db.query(
        'SELECT dept.department_name, COUNT(a.appointment_id) AS appointments FROM departments dept LEFT JOIN doctors d ON dept.department_id = d.department_id LEFT JOIN appointments a ON d.doctor_id = a.doctor_id GROUP BY dept.department_id ORDER BY appointments DESC LIMIT 6'
      );
      result.recentAppointments = recentAppointments;
      result.recentPayments = recentPayments;
      result.lowStock = lowStock;
      result.deptStats = deptStats;

    } else if (role === 'Doctor') {
      let doctor_id = req.user.doctor_id;
      if (!doctor_id) {
        const [docRows] = await db.query('SELECT doctor_id FROM doctors WHERE user_id = ? LIMIT 1', [req.user.user_id]);
        doctor_id = docRows[0]?.doctor_id;
      }
      if (doctor_id) {
        const [myAppointments] = await db.query(
          'SELECT a.*, p.full_name AS patient_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC LIMIT 8',
          [doctor_id]
        );
        const [myPendingTests] = await db.query(
          "SELECT lt.*, p.full_name AS patient_name FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id WHERE lt.doctor_id = ? AND lt.status = 'pending' LIMIT 6",
          [doctor_id]
        );
        result.myAppointments = myAppointments;
        result.myPendingTests = myPendingTests;
      }

    } else if (role === 'Receptionist') {
      const [upcomingAppointments] = await db.query(
        "SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.appointment_date >= NOW() ORDER BY a.appointment_date ASC LIMIT 8"
      );
      const [recentAdmissions] = await db.query(
        "SELECT a.*, p.full_name AS patient_name FROM admissions a LEFT JOIN patients p ON a.patient_id = p.patient_id WHERE a.status = 'admitted' ORDER BY a.created_at DESC LIMIT 6"
      );
      result.upcomingAppointments = upcomingAppointments;
      result.recentAdmissions = recentAdmissions;

    } else if (role === 'Pharmacist') {
      const [lowStock] = await db.query('SELECT * FROM medicines WHERE quantity <= low_stock_threshold ORDER BY quantity ASC LIMIT 10');
      const [expiringMeds] = await db.query("SELECT * FROM medicines WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE() ORDER BY expiry_date ASC LIMIT 10");
      result.lowStock = lowStock;
      result.expiringMeds = expiringMeds;

    } else if (role === 'Laboratory Technician') {
      const [pendingTests] = await db.query(
        "SELECT lt.*, p.full_name AS patient_name FROM laboratory_tests lt LEFT JOIN patients p ON lt.patient_id = p.patient_id WHERE lt.status IN ('pending','in_progress') ORDER BY lt.created_at DESC LIMIT 10"
      );
      result.pendingTests = pendingTests;
    }

    return success(res, result, 'Dashboard data fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const toDate = to || new Date().toISOString().slice(0, 10);
    const [rows] = await db.query(
      `SELECT py.payment_id, py.payment_date, py.amount_paid, py.payment_method, pt.full_name AS patient_name, b.total_amount, b.bill_status
       FROM payments py LEFT JOIN bills b ON py.bill_id = b.bill_id LEFT JOIN patients pt ON b.patient_id = pt.patient_id
       WHERE py.payment_date BETWEEN ? AND ? ORDER BY py.payment_date DESC`,
      [fromDate, toDate]
    );
    const [[{ total }]] = await db.query('SELECT IFNULL(SUM(amount_paid),0) AS total FROM payments WHERE payment_date BETWEEN ? AND ?', [fromDate, toDate]);
    return success(res, { rows, total, from: fromDate, to: toDate }, 'Revenue report fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

const getAppointmentReport = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const toDate = to || new Date().toISOString().slice(0, 10);
    const where = ['DATE(a.appointment_date) BETWEEN ? AND ?'];
    const params = [fromDate, toDate];
    if (status) { where.push('a.status = ?'); params.push(status); }
    const [rows] = await db.query(
      `SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id WHERE ${where.join(' AND ')} ORDER BY a.appointment_date DESC`,
      params
    );
    return success(res, { rows, total: rows.length, from: fromDate, to: toDate }, 'Appointment report fetched');
  } catch (err) {
    console.error(err);
    return fail(res, 'Server error', null, 500);
  }
};

module.exports = { getDashboard, getRevenueReport, getAppointmentReport };
