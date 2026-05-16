-- Backfill doctors table for existing users with the Doctor role
-- Run this once in your MySQL environment (be sure to backup first)

USE smartcare_hospital_db;

INSERT INTO doctors (full_name, specialization, email, phone, department_id, user_id, created_at)
SELECT u.username, '', u.email, '', NULL, u.user_id, NOW()
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE r.role_name = 'Doctor'
AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.user_id);
