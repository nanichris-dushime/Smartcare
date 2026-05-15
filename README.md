# SmartCare Hospital Management System

This is a beginner-friendly full-stack hospital management system built with Node.js, Express, MySQL (mysql2), and a simple HTML/CSS frontend.

Overview:
- Backend: Express.js with JWT authentication and MySQL connection pooling.
- Frontend: Pure HTML/CSS/JS (no frameworks) with Fetch API.

Setup
1. Install dependencies
```
cd /home/nani/Desktop/Projects/Smartcare
npm install
```

2. Create .env in `backend/` using `.env.example` and set DB credentials

3. Ensure the database `smartcare_hospital_db` exists and run `database/smartcare.sql` to create tables and sample data.

4. Start server
```
npm run dev
```

5. Open frontend pages using a simple static server or open the HTML files in your browser. The frontend expects backend at `http://localhost:5000`.

API Samples
- Register: POST /api/auth/register {username,email,password,role_name}
- Login: POST /api/auth/login {email,password}
- Get patients: GET /api/patients (requires Authorization header)

.env example (backend/.env.example provided)

Notes
- This project is a scaffold focusing on structure, authentication, and a few core modules. Extend controllers/routes for full functionality (appointments, bills, payments, reports, etc.).
