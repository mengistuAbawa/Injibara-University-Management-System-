const db = require('../config/db');
const crypto = require('crypto');
const { hash } = require('../utils/hashPassword');
const generateUsername = require('../utils/generateUsername');
const generateToken = require('../utils/generateToken');

const roles = ['student', 'registrar', 'instructor', 'head', 'admin', 'finance', 'dean'];
const staffRanks = ['Graduate Assistant', 'Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'];
const deanRanks = ['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'];

exports.listDepartments = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT department_id, department_name FROM departments ORDER BY department_name');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.listColleges = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT college_id, college_name FROM colleges ORDER BY college_name');
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
    if (role === 'dean' && (!details.employee_number || !details.college_id || !deanRanks.includes(details.academic_rank))) {
      return res.status(400).json({ message: 'Employee number, college, and academic rank are required for a dean request' });
    }
    if (['registrar', 'admin', 'finance'].includes(role) && !details.employee_number) {
      return res.status(400).json({ message: 'Employee number is required' });
    }
    if (details.department_id) {
      const [[department]] = await db.query('SELECT department_id FROM departments WHERE department_id = ?', [details.department_id]);
      if (!department) return res.status(400).json({ message: 'Choose a valid department' });
    }
    if (details.college_id) {
      const [[college]] = await db.query('SELECT college_id FROM colleges WHERE college_id = ?', [details.college_id]);
      if (!college) return res.status(400).json({ message: 'Choose a valid college' });
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
    const username = generateUsername(details.student_number || details.employee_number);
    const message = role === 'dean'
      ? 'Your dean access request was submitted to the Registrar. You can sign in after it is approved.'
      : 'Your access request was submitted. The appropriate university office will review it.';
    res.status(201).json({ message, role, status: 'Pending', username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account or pending request already uses that email or identifier' });
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const allowedRoles = req.user.role === 'admin'
      ? ['student', 'instructor', 'head', 'finance', 'dean']
      : ['student', 'instructor', 'head', 'dean'];
    const [rows] = await db.query(
      `SELECT ar.request_id, ar.role, ar.email, ar.applicant_data, ar.status, ar.submitted_at,
              ap.applicant_id, ap.first_name AS applicant_first_name, ap.last_name AS applicant_last_name,
              ap.grandfather_name, ap.gender, ap.date_of_birth, ap.phone_number, ap.region,
              ap.high_school_name, ap.high_school_region, ap.university_entrance_result,
              ap.first_choice_department, ap.second_choice_department, ap.third_choice_department,
              ap.transcript_url, ap.photo_url, d1.department_name AS first_choice_name,
              d2.department_name AS second_choice_name, d3.department_name AS third_choice_name,
              college.college_name
       FROM access_requests ar LEFT JOIN applicant_profiles ap ON ap.access_request_id=ar.request_id
       LEFT JOIN users request_user ON request_user.email=ar.email
       LEFT JOIN departments d1 ON d1.department_id=ap.first_choice_department
       LEFT JOIN departments d2 ON d2.department_id=ap.second_choice_department
       LEFT JOIN departments d3 ON d3.department_id=ap.third_choice_department
       LEFT JOIN colleges college ON college.college_id=(ar.applicant_data::jsonb ->> 'college_id')::integer
       WHERE ar.role IN (?) AND (ar.status = 'Pending' OR
         (ar.role='dean' AND ar.status='Approved' AND request_user.role='dean' AND
          NOT EXISTS (SELECT 1 FROM college_deans cd WHERE cd.user_id=request_user.user_id)))
       ORDER BY ar.submitted_at`,
      [allowedRoles]
    );
    res.json(rows.map((row) => {
      const applicantData = JSON.parse(row.applicant_data);
      if (row.role === 'dean') applicantData.department_name = row.college_name ? `College: ${row.college_name}` : 'College not found';
      return { ...row, applicant_data: applicantData, needs_dean_setup: row.role === 'dean' && row.status === 'Approved' };
    }));
  } catch (err) { next(err); }
};

exports.review = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[request]] = await conn.query('SELECT * FROM access_requests WHERE request_id = ? FOR UPDATE', [req.params.requestId]);
    let legacyDeanUser = null;
    if (request?.role === 'dean' && request.status === 'Approved') {
      const [[oldUser]] = await conn.query('SELECT user_id,username,role FROM users WHERE email=? FOR UPDATE', [request.email]);
      if (oldUser?.role === 'dean') {
        const [[profile]] = await conn.query('SELECT dean_id FROM college_deans WHERE user_id=? LIMIT 1', [oldUser.user_id]);
        if (!profile) legacyDeanUser = oldUser;
      }
    }
    if (!request || (request.status !== 'Pending' && !legacyDeanUser)) {
      await conn.rollback();
      return res.status(404).json({ message: 'Pending access request not found' });
    }
    if (legacyDeanUser && req.body.decision !== 'approve') {
      await conn.rollback();
      return res.status(400).json({ message: 'Complete this previously approved dean account by assigning an academic rank.' });
    }
    if (req.user.role === 'registrar' && !['student', 'instructor', 'head', 'dean'].includes(request.role)) {
      await conn.rollback();
      return res.status(403).json({ message: 'This role cannot review that request' });
    }
    const { decision } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Choose approve or reject' });
    }
    let approvedInstructorId = null;
    let approvedStudentNumber = null;
    let approvedUsername = null;
    if (decision === 'approve') {
      const data = JSON.parse(request.applicant_data);
      const role = ['head', 'dean'].includes(request.role) ? 'instructor' : request.role;
      if (request.role === 'dean') {
        const requestedRank = req.body.academic_rank || data.academic_rank;
        if (!deanRanks.includes(requestedRank)) {
          await conn.rollback();
          return res.status(400).json({ message: 'Choose a valid academic rank to finish setting up this dean account.' });
        }
        data.academic_rank = requestedRank;
        const [[college]] = await conn.query('SELECT college_id,dean_user_id FROM colleges WHERE college_id=? FOR UPDATE', [data.college_id]);
        if (!college) {
          await conn.rollback();
          return res.status(400).json({ message: 'The college on this dean request no longer exists.' });
        }
        const [[assigned]] = await conn.query('SELECT dean_id FROM college_deans WHERE college_id=? FOR UPDATE', [data.college_id]);
        if (college.dean_user_id || assigned) {
          await conn.rollback();
          return res.status(409).json({ message: 'This college already has a dean assigned.' });
        }
        const [[employee]] = await conn.query('SELECT instructor_id FROM instructors WHERE employee_number=? LIMIT 1', [data.employee_number]);
        if (employee) {
          await conn.rollback();
          return res.status(409).json({ message: 'This employee number already belongs to an instructor.' });
        }
      }
      const [[applicant]] = request.role === 'student'
        ? await conn.query('SELECT * FROM applicant_profiles WHERE access_request_id = ?', [request.request_id])
        : [[]];
      const generatedStudentNumber = applicant ? `APP${new Date().getFullYear()}${String(request.request_id).padStart(6, '0')}` : null;
      approvedStudentNumber = generatedStudentNumber;
      const accountNumber = request.role === 'student' ? (generatedStudentNumber || data.student_number) : data.employee_number;
      const username = generateUsername(accountNumber);
      approvedUsername = username;
      let user;
      if (legacyDeanUser && request.role === 'dean') {
        await conn.query('UPDATE users SET role=?,college_id=? WHERE user_id=?', [role, data.college_id, legacyDeanUser.user_id]);
        user = { insertId: legacyDeanUser.user_id };
        approvedUsername = legacyDeanUser.username || username;
      } else {
        const [userResult] = await conn.query(
          'INSERT INTO users (username, first_name, last_name, email, password_hash, role, college_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [username, data.first_name, data.last_name, request.email, request.password_hash, role, request.role === 'dean' ? data.college_id : null]
        );
        user = userResult;
      }
      if (request.role === 'student') {
        if (applicant) {
          const studentNumber = generatedStudentNumber;
          await conn.query(
            `INSERT INTO students (user_id, student_number, first_name, last_name, grandfather_name, gender, date_of_birth,
             phone_number, region, department_id, admission_year, university_entrance_result)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user.insertId, studentNumber, applicant.first_name, applicant.last_name, applicant.grandfather_name,
              applicant.gender, applicant.date_of_birth, applicant.phone_number, applicant.region,
              applicant.first_choice_department, new Date().getFullYear(), applicant.university_entrance_result]
          );
          await conn.query('UPDATE access_requests SET registrar_note = ? WHERE request_id = ?',
            ['Approved as student number ' + studentNumber, request.request_id]);
        } else {
        await conn.query(
          `INSERT INTO students (user_id, student_number, first_name, last_name, grandfather_name, department_id, phone_number, admission_year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.insertId, data.student_number, data.first_name, data.last_name, data.grandfather_name, data.department_id, data.phone_number || null, data.admission_year || new Date().getFullYear()]
        );
        }
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
      } else if (request.role === 'dean') {
        const [instructor] = await conn.query(
          `INSERT INTO instructors (user_id,employee_number,first_name,last_name,gender,phone_number,academic_rank,office_location,hire_date)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [user.insertId, data.employee_number, data.first_name, data.last_name, data.gender || null, data.phone_number || null, data.academic_rank, data.office_location || null, data.hire_date || null]
        );
        approvedInstructorId = instructor.insertId;
        const [dean] = await conn.query(
          `INSERT INTO college_deans (user_id,employee_number,first_name,last_name,gender,phone_number,academic_rank,college_id,office_location,hire_date)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [user.insertId, data.employee_number, data.first_name, data.last_name, data.gender || null, data.phone_number || null, data.academic_rank, data.college_id, data.office_location || null, data.hire_date || null]
        );
        await conn.query('UPDATE colleges SET dean_user_id=?,dean_name=? WHERE college_id=?', [user.insertId, `${data.first_name} ${data.last_name}`, data.college_id]);
        await conn.query(
          `INSERT INTO dean_audit_logs (college_id,dean_user_id,action,entity_type,entity_id,details)
           VALUES (?,?,'assign','dean',?,JSON_OBJECT('source','approved_access_request'))`,
          [data.college_id, user.insertId, dean.insertId]
        );
        await conn.query('UPDATE access_requests SET applicant_data=? WHERE request_id=?', [JSON.stringify(data), request.request_id]);
      }
    }
    await conn.query('UPDATE access_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), registrar_note = COALESCE(?, registrar_note) WHERE request_id = ?',
      [decision === 'approve' ? 'Approved' : 'Rejected', req.user.id, String(req.body.registrar_note || '').slice(0, 4000) || null, request.request_id]);
    await conn.commit();
    res.json({
      message: request.role === 'dean' && decision === 'approve'
        ? `Dean request approved. The account is ready to sign in as ${approvedUsername}.`
        : `Request ${decision}d`,
      instructor_id: request.role === 'instructor' ? approvedInstructorId : null,
      student_number: approvedStudentNumber,
      username: decision === 'approve' ? approvedUsername : null,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account or university identifier already exists' });
    next(err);
  } finally { conn.release(); }
};
