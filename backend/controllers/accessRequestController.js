const db = require('../config/db');
const crypto = require('crypto');
const { hash } = require('../utils/hashPassword');
const generateUsername = require('../utils/generateUsername');
const generateToken = require('../utils/generateToken');

const roles = ['student', 'registrar', 'instructor', 'head', 'admin'];
const staffRanks = ['Graduate Assistant', 'Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'];

exports.listDepartments = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT department_id, department_name FROM departments ORDER BY department_name');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.submit = async (req, res, next) => {
  try {
    const { role, email, password, first_name, last_name } = req.body;
    if (!roles.includes(role)) return res.status(400).json({ message: 'Choose a valid university role' });
    if (!email || !password || password.length < 8 || !first_name || !last_name) {
      return res.status(400).json({ message: 'Enter your name, email, and a password with at least 8 characters' });
    }

    const details = { ...req.body };
    delete details.password;
    if (role === 'student' && (!details.student_number || !details.grandfather_name || !details.department_id)) {
      return res.status(400).json({ message: 'Student number, grandfather name, and department are required' });
    }
    if (['instructor', 'head'].includes(role) && (!details.employee_number || !details.department_id || !staffRanks.includes(details.academic_rank))) {
      return res.status(400).json({ message: 'Employee number, department, and academic rank are required' });
    }
    if (['registrar', 'admin'].includes(role) && !details.employee_number) {
      return res.status(400).json({ message: 'Employee number is required' });
    }
    if (details.department_id) {
      const [[department]] = await db.query('SELECT department_id FROM departments WHERE department_id = ?', [details.department_id]);
      if (!department) return res.status(400).json({ message: 'Choose a valid department' });
    }
    const [[existingUser]] = await db.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);
    if (existingUser) return res.status(409).json({ message: 'An account already uses that email address' });

    if (['registrar', 'admin'].includes(role)) {
      const codeVariable = role === 'registrar' ? 'REGISTRAR_SIGNUP_CODE' : 'ADMIN_SIGNUP_CODE';
      const configuredCode = process.env[codeVariable] || '';
      const providedCode = String(req.body.invite_code || '');
      if (!configuredCode) return res.status(503).json({ message: `${role === 'admin' ? 'Admin' : 'Registrar'} self-registration is not enabled. Contact the system administrator.` });
      const configuredBuffer = Buffer.from(configuredCode);
      const providedBuffer = Buffer.from(providedCode);
      const validCode = configuredBuffer.length === providedBuffer.length && crypto.timingSafeEqual(configuredBuffer, providedBuffer);
      if (!validCode) return res.status(403).json({ message: `A valid ${role} invitation code is required.` });
      const username = generateUsername(details.employee_number);
      const [userResult] = await db.query(
        'INSERT INTO users (username, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, first_name, last_name, String(email).trim().toLowerCase(), hash(password), role]
      );
      const user = { user_id: userResult.insertId, username, avatar_path: null, email: String(email).trim().toLowerCase(), role, first_name, last_name, is_hod: false };
      const token = generateToken({ id: user.user_id, role, is_hod: false });
      return res.status(201).json({ token, user, message: `${role} account created. You are now signed in.` });
    }

    await db.query(
      `INSERT INTO access_requests (role, email, password_hash, applicant_data)
       VALUES (?, ?, ?, ?)`,
      [role, String(email).trim().toLowerCase(), hash(password), JSON.stringify(details)]
    );
    res.status(201).json({ message: 'Your access request was submitted. The appropriate university office will review it.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account or pending request already uses that email or identifier' });
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const allowedRoles = req.user.role === 'registrar' ? ['student', 'instructor', 'head'] : ['student', 'instructor', 'head'];
    const [rows] = await db.query(
      `SELECT request_id, role, email, applicant_data, status, submitted_at
       FROM access_requests WHERE role IN (?) AND status = 'Pending' ORDER BY submitted_at`,
      [allowedRoles]
    );
    res.json(rows.map((row) => ({ ...row, applicant_data: JSON.parse(row.applicant_data) })));
  } catch (err) { next(err); }
};

exports.review = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[request]] = await conn.query('SELECT * FROM access_requests WHERE request_id = ? FOR UPDATE', [req.params.requestId]);
    if (!request || request.status !== 'Pending') {
      await conn.rollback();
      return res.status(404).json({ message: 'Pending access request not found' });
    }
    if (req.user.role === 'registrar' && !['student', 'instructor', 'head'].includes(request.role)) {
      await conn.rollback();
      return res.status(403).json({ message: 'This role cannot review that request' });
    }
    const { decision } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Choose approve or reject' });
    }
    let approvedInstructorId = null;
    if (decision === 'approve') {
      const data = JSON.parse(request.applicant_data);
      const role = request.role === 'head' ? 'instructor' : request.role;
      const accountNumber = request.role === 'student' ? data.student_number : data.employee_number;
      const username = generateUsername(accountNumber);
      const [user] = await conn.query(
        'INSERT INTO users (username, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, data.first_name, data.last_name, request.email, request.password_hash, role]
      );
      if (request.role === 'student') {
        await conn.query(
          `INSERT INTO students (user_id, student_number, first_name, last_name, grandfather_name, department_id, phone_number, admission_year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.insertId, data.student_number, data.first_name, data.last_name, data.grandfather_name, data.department_id, data.phone_number || null, data.admission_year || new Date().getFullYear()]
        );
      } else if (['instructor', 'head'].includes(request.role)) {
        if (request.role === 'head') {
          await conn.query('UPDATE instructors SET is_hod = FALSE, hod_department_id = NULL WHERE hod_department_id = ?', [data.department_id]);
          await conn.query('UPDATE departments SET hod_user_id = NULL WHERE department_id = ?', [data.department_id]);
        }
        const [instructor] = await conn.query(
          `INSERT INTO instructors (user_id, employee_number, first_name, last_name, academic_rank, department_id, phone_number, is_hod, hod_department_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.insertId, data.employee_number, data.first_name, data.last_name, data.academic_rank, data.department_id, data.phone_number || null, request.role === 'head', request.role === 'head' ? data.department_id : null]
        );
        approvedInstructorId = instructor.insertId;
        if (request.role === 'head') await conn.query('UPDATE departments SET hod_user_id = ? WHERE department_id = ?', [user.insertId, data.department_id]);
      }
    }
    await conn.query('UPDATE access_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE request_id = ?', [decision === 'approve' ? 'Approved' : 'Rejected', req.user.id, request.request_id]);
    await conn.commit();
    res.json({
      message: `Request ${decision}d`,
      instructor_id: request.role === 'instructor' ? approvedInstructorId : null,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account or university identifier already exists' });
    next(err);
  } finally { conn.release(); }
};
