const db = require('../config/db');

// Returns different dashboard data depending on the role_name in req.user
const getDashboard = async (req, res) => {
  try{
    const role = req.user.role_name;
    // common stats
    const [[{totalPatients}]] = await db.query('SELECT COUNT(*) AS totalPatients FROM patients');
    const [[{totalDoctors}]] = await db.query('SELECT COUNT(*) AS totalDoctors FROM doctors');
    const [[{totalAppointments}]] = await db.query('SELECT COUNT(*) AS totalAppointments FROM appointments');
    const [[{totalRevenue}]] = await db.query('SELECT IFNULL(SUM(total_amount),0) AS totalRevenue FROM bills');

    const result = { totalPatients, totalDoctors, totalAppointments, totalRevenue };

    if (role === 'Admin'){
      // admin gets everything
      const [recentAppointments] = await db.query('SELECT a.*, p.full_name AS patient_name, d.full_name AS doctor_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id LEFT JOIN doctors d ON a.doctor_id = d.doctor_id ORDER BY a.appointment_date DESC LIMIT 6');
      result.recentAppointments = recentAppointments;
      result.monthlyStats = await db.query("SELECT DATE_FORMAT(appointment_date, '%Y-%m') AS month, COUNT(*) AS count FROM appointments GROUP BY month ORDER BY month DESC LIMIT 6");
    } else if (role === 'Doctor'){
      // doctor sees their own appointments and patients
      const doctor_id = req.user.user_id; // Note: user_id vs doctor_id mapping is app-specific; assume user_id matches doctor.user_id if linked
      const [myAppointments] = await db.query('SELECT a.* FROM appointments a WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC LIMIT 6', [doctor_id]);
      result.myAppointments = myAppointments;
    } else if (role === 'Receptionist'){
      // receptionist sees appointments and admissions
      const [upcoming] = await db.query('SELECT a.*, p.full_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.patient_id WHERE a.appointment_date >= NOW() ORDER BY a.appointment_date ASC LIMIT 6');
      result.upcomingAppointments = upcoming;
    } else if (role === 'Pharmacist'){
      // pharmacist sees low stock medicines
      const [lowStock] = await db.query('SELECT * FROM medicines WHERE quantity <= 10 ORDER BY quantity ASC LIMIT 10');
      result.lowStock = lowStock;
    } else if (role === 'Laboratory Technician'){
      const [pendingTests] = await db.query('SELECT * FROM laboratory_tests WHERE result IS NULL ORDER BY test_date DESC LIMIT 10');
      result.pendingTests = pendingTests;
    }

    res.json(result);
  }catch(err){
    console.error(err);
    res.status(500).json({message:'Server error'});
  }
};

module.exports = { getDashboard };
