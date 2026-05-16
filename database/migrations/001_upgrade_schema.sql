-- SmartCare Hospital DB - Upgrade Migration 001
-- Run: mysql -u root -p smartcare_hospital_db < 001_upgrade_schema.sql
-- Safe: uses ALTER TABLE, no data destruction

USE smartcare_hospital_db;

-- ─── ROLES ───────────────────────────────────────────────────────────────────
ALTER TABLE roles
  MODIFY COLUMN role_name VARCHAR(50) NOT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE roles ADD UNIQUE INDEX IF NOT EXISTS uq_role_name (role_name);

-- ─── USERS ───────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_role (role_id);

-- ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;

ALTER TABLE departments ADD UNIQUE INDEX IF NOT EXISTS uq_dept_name (department_name);

-- ─── DOCTORS ─────────────────────────────────────────────────────────────────
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS availability_status ENUM('available','unavailable','on_leave') DEFAULT 'available';

ALTER TABLE doctors ADD INDEX IF NOT EXISTS idx_doctors_dept (department_id);
ALTER TABLE doctors ADD INDEX IF NOT EXISTS idx_doctors_user (user_id);

-- ─── PATIENTS ────────────────────────────────────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20) DEFAULT NULL;

ALTER TABLE patients ADD INDEX IF NOT EXISTS idx_patients_name (full_name);
ALTER TABLE patients ADD INDEX IF NOT EXISTS idx_patients_phone (phone);

-- ─── APPOINTMENTS ────────────────────────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  MODIFY COLUMN status ENUM('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled';

ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appt_patient (patient_id);
ALTER TABLE appointments ADD INDEX IF NOT EXISTS idx_appt_date (appointment_date);

-- ─── ADMISSIONS ──────────────────────────────────────────────────────────────
ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS doctor_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS diagnosis TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  MODIFY COLUMN status ENUM('admitted','discharged','transferred') DEFAULT 'admitted';

ALTER TABLE admissions ADD INDEX IF NOT EXISTS idx_admissions_patient (patient_id);
ALTER TABLE admissions ADD INDEX IF NOT EXISTS idx_admissions_status (status);

-- Add FK for admissions.doctor_id if not exists
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'admissions'
  AND CONSTRAINT_NAME = 'fk_admissions_doctor'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE admissions ADD CONSTRAINT fk_admissions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── BILLS ───────────────────────────────────────────────────────────────────
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS appointment_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admission_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  MODIFY COLUMN bill_status ENUM('pending','partial','paid','cancelled') DEFAULT 'pending';

ALTER TABLE bills ADD INDEX IF NOT EXISTS idx_bills_patient (patient_id);
ALTER TABLE bills ADD INDEX IF NOT EXISTS idx_bills_status (bill_status);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS notes VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN payment_method ENUM('cash','card','insurance','bank_transfer','online') DEFAULT 'cash';

ALTER TABLE payments ADD INDEX IF NOT EXISTS idx_payments_bill (bill_id);

-- ─── MEDICINES ───────────────────────────────────────────────────────────────
ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;

ALTER TABLE medicines ADD INDEX IF NOT EXISTS idx_medicines_name (medicine_name);
ALTER TABLE medicines ADD INDEX IF NOT EXISTS idx_medicines_expiry (expiry_date);

-- ─── LABORATORY TESTS ────────────────────────────────────────────────────────
ALTER TABLE laboratory_tests
  ADD COLUMN IF NOT EXISTS status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE laboratory_tests ADD INDEX IF NOT EXISTS idx_lab_patient (patient_id);
ALTER TABLE laboratory_tests ADD INDEX IF NOT EXISTS idx_lab_status (status);

-- ─── SEED ROLES (idempotent) ─────────────────────────────────────────────────
INSERT IGNORE INTO roles (role_name) VALUES
  ('Admin'), ('Doctor'), ('Receptionist'), ('Pharmacist'), ('Laboratory Technician');

SELECT 'Migration 001 complete' AS status;
