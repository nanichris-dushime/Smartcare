-- SmartCare database schema
CREATE DATABASE IF NOT EXISTS smartcare_hospital_db;
USE smartcare_hospital_db;

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    department_id INT,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id)
    REFERENCES departments(department_id)
);
-- If users table exists, link doctors.user_id to users.user_id
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL;
ALTER TABLE doctors ADD CONSTRAINT IF NOT EXISTS fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    blood_group VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    appointment_date DATETIME,
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id)
    REFERENCES doctors(doctor_id)
);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments (doctor_id, appointment_date);


-- Admissions Table
CREATE TABLE IF NOT EXISTS admissions (
    admission_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    room_number VARCHAR(20),
    admission_date DATE,
    discharge_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id)
);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    total_amount DECIMAL(10,2),
    bill_status VARCHAR(50),
    bill_date DATE,
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT,
    amount_paid DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_date DATE,
    FOREIGN KEY (bill_id)
    REFERENCES bills(bill_id)
);

-- Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(100),
    quantity INT,
    unit_price DECIMAL(10,2),
    expiry_date DATE,
    supplier VARCHAR(100)
);

-- Laboratory Tests Table
CREATE TABLE IF NOT EXISTS laboratory_tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    test_name VARCHAR(100),
    result TEXT,
    test_date DATE,
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id)
    REFERENCES doctors(doctor_id)
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id)
    REFERENCES roles(role_id)
);

-- Sample data
INSERT INTO roles (role_name) VALUES ('Admin'), ('Doctor'), ('Receptionist'), ('Pharmacist'), ('Laboratory Technician')
ON DUPLICATE KEY UPDATE role_name = role_name;

INSERT INTO departments (department_name, description) VALUES ('General Medicine','General care'), ('Pediatrics','Children care')
ON DUPLICATE KEY UPDATE department_name = department_name;
