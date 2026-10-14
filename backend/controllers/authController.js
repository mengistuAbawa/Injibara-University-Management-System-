const db = require('../config/db');
const { compare } = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const loginName = String(username).trim();
    const normalizedStudentNumber = loginName.toUpperCase();
    const alternateStudentNumber = normalizedStudentNumber.startsWith('INU')
      ? normalizedStudentNumber.slice(3)
      : `INU${normalizedStudentNumber}`;

    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.avatar_path, u.email, u.password_hash, u.role,
              s.student_id, s.student_number,
              COALESCE(s.first_name, i.first_name, u.first_name) AS first_name,
              COALESCE(s.last_name, i.last_name, u.last_name) AS last_name,
              s.current_year, s.status, s.dormitory, s.grandfather_name,
              d.department_name, i.instructor_id, i.is_hod, i.hod_department_id, u.is_active
       FROM users u
       LEFT JOIN students s   ON s.user_id = u.user_id
       LEFT JOIN departments d ON s.department_id = d.department_id
       LEFT JOIN instructors i ON i.user_id = u.user_id
       WHERE u.username = ? OR u.email = ?
          OR s.student_number = ? OR s.student_number = ?
          OR i.employee_number = ? OR i.employee_number = ?
       ORDER BY (u.username = ?) DESC, (s.student_number = ?) DESC, (i.employee_number = ?) DESC
       LIMIT 1`,
      [loginName, loginName, loginName, alternateStudentNumber, loginName, alternateStudentNumber, loginName, loginName, loginName]
    );

    if (rows.length === 0) {
      const [requests] = await db.query(
        `SELECT status FROM access_requests
         WHERE email = ?
            OR JSON_UNQUOTE(JSON_EXTRACT(applicant_data, '$.student_number')) IN (?, ?)
            OR JSON_UNQUOTE(JSON_EXTRACT(applicant_data, '$.employee_number')) IN (?, ?)
         ORDER BY submitted_at DESC LIMIT 1`,
        [loginName, loginName, alternateStudentNumber, loginName, alternateStudentNumber]
      );
      if (requests[0]?.status === 'Pending') {
        return res.status(403).json({ message: 'Your account request is awaiting approval. Please contact the Registrar’s Office for an update.' });
      }
      if (requests[0]?.status === 'Rejected') {
        return res.status(403).json({ message: 'Your account request was not approved. Please contact the appropriate university office.' });
      }
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ message: 'This account is inactive. Contact the university registrar.' });
    const ok = await compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: 'Invalid username or password' });

    const token = generateToken({
      id: user.user_id,
      student_id: user.student_id ?? null,
      instructor_id: user.instructor_id ?? null,
      role: user.role,
      is_hod: Boolean(user.is_hod),
      hod_department_id: user.hod_department_id,
    });
    delete user.password_hash;
    user.is_hod = Boolean(user.is_hod);
    res.json({ token, student: user });
  } catch (err) {
    next(err);
  }
};
