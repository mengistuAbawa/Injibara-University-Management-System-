const db = require('../config/db');
const { hash } = require('../utils/hashPassword');
const generateTempPassword = require('../utils/generateTempPassword');
const generateUsername = require('../utils/generateUsername');

/* =========================================================
   1. SYSTEM-WIDE DASHBOARD STATS
   ========================================================= */
exports.getStats = async (req, res, next) => {
  try {
    const [[{ students }]]    = await db.query('SELECT COUNT(*) AS students FROM students');
    const [[{ instructors }]] = await db.query('SELECT COUNT(*) AS instructors FROM instructors');
    const [[{ courses }]]     = await db.query('SELECT COUNT(*) AS courses FROM courses');
    const [[{ sections }]]    = await db.query('SELECT COUNT(*) AS sections FROM sections');
    const [[{ departments }]] = await db.query('SELECT COUNT(*) AS departments FROM departments');
    const [[{ fields }]]      = await db.query('SELECT COUNT(*) AS fields FROM fields');
    const [[{ enrollments }]] = await db.query(`SELECT COUNT(*) AS enrollments FROM enrollments WHERE status='Enrolled'`);
    const [[{ users }]]       = await db.query('SELECT COUNT(*) AS users FROM users');

    res.json({
      students, instructors, courses, sections,
      departments, fields, enrollments, users,
    });
  } catch (err) { next(err); }
};

/* =========================================================
   2. USERS
   ========================================================= */
exports.listUsers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, username, first_name, last_name, email, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { email, first_name, last_name, role } = req.body;
    if (!email || !first_name || !last_name || !['admin','registrar','instructor','student','finance'].includes(role)) {
      return res.status(400).json({ message: 'Name, email, and a valid role are required' });
    }
    await db.query('UPDATE users SET email = ?, first_name = ?, last_name = ?, role = ? WHERE user_id = ?',
      [String(email).trim(), first_name.trim(), last_name.trim(), role, req.params.userId]);
    await Promise.all([
      db.query('UPDATE students SET first_name = ?, last_name = ? WHERE user_id = ?', [first_name.trim(), last_name.trim(), req.params.userId]),
      db.query('UPDATE instructors SET first_name = ?, last_name = ? WHERE user_id = ?', [first_name.trim(), last_name.trim(), req.params.userId]),
    ]);
    res.json({ message: 'User updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  let conn;
  try {
    if (Number(req.params.userId) === Number(req.user.id || req.user.user_id)) return res.status(400).json({ message: 'You cannot delete your own account' });

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[user]] = await conn.query(
      'SELECT user_id FROM users WHERE user_id = ? FOR UPDATE',
      [req.params.userId]
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    // Sections restrict instructor deletion, so clear assignments first. Student
    // profiles and their dependent records are removed by the configured cascades.
    await conn.query(
      `UPDATE sections s
       INNER JOIN instructors i ON i.instructor_id = s.instructor_id
       SET s.instructor_id = NULL
       WHERE i.user_id = ?`,
      [req.params.userId]
    );
    await conn.query('DELETE FROM users WHERE user_id = ?', [req.params.userId]);
    await conn.commit();
    res.json({ message: 'User deleted' });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
};

/* =========================================================
   COLLEGES
   ========================================================= */
exports.listColleges = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT c.*, COUNT(d.department_id) AS department_count
      FROM colleges c LEFT JOIN departments d ON d.college_id = c.college_id
      GROUP BY c.college_id ORDER BY c.college_name`);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createCollege = async (req, res, next) => {
  try {
    const { college_name, college_code } = req.body;
    if (!college_name?.trim() || !college_code?.trim()) return res.status(400).json({ message: 'College name and code are required' });
    await db.query('INSERT INTO colleges (college_name, college_code) VALUES (?, ?)', [college_name.trim(), college_code.trim()]);
    res.status(201).json({ message: 'College created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'College name or code already exists' });
    next(err);
  }
};

exports.updateCollege = async (req, res, next) => {
  try {
    const { college_name, college_code } = req.body;
    if (!college_name?.trim() || !college_code?.trim()) return res.status(400).json({ message: 'College name and code are required' });
    await db.query('UPDATE colleges SET college_name = ?, college_code = ? WHERE college_id = ?', [college_name.trim(), college_code.trim(), req.params.id]);
    res.json({ message: 'College updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'College name or code already exists' });
    next(err);
  }
};

exports.deleteCollege = async (req, res, next) => {
  try {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM departments WHERE college_id = ?', [req.params.id]);
    if (count) return res.status(400).json({ message: 'Move the college departments before deleting it' });
    await db.query('DELETE FROM colleges WHERE college_id = ?', [req.params.id]);
    res.json({ message: 'College deleted' });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }
    if (!req.body.first_name || !req.body.last_name) {
      return res.status(400).json({ message: 'First and last name are required' });
    }
    if (!['registrar', 'instructor', 'finance'].includes(role)) {
      return res.status(400).json({ message: 'Choose registrar, instructor, or finance' });
    }
    if (!req.body.employee_number) {
      return res.status(400).json({ message: 'Employee number is required to create a staff username' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    let instructor;
    if (role === 'instructor') {
      const { employee_number, first_name, last_name, academic_rank, department_id } = req.body;
      if (!employee_number || !first_name || !last_name || !academic_rank || !department_id) {
        return res.status(400).json({ message: 'Instructor name, employee number, rank, and department are required' });
      }
      const ranks = ['Graduate Assistant', 'Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'];
      if (!ranks.includes(academic_rank)) {
        return res.status(400).json({ message: 'Invalid academic rank' });
      }
      const [[department]] = await conn.query('SELECT department_id FROM departments WHERE department_id = ?', [department_id]);
      if (!department) return res.status(400).json({ message: 'Choose a valid department' });
      instructor = { employee_number, first_name, last_name, academic_rank, department_id, gender: req.body.gender || null, phone_number: req.body.phone_number || null };
    }

    await conn.beginTransaction();
    const [userResult] = await conn.query(
      'INSERT INTO users (username, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [generateUsername(req.body.employee_number), req.body.first_name, req.body.last_name, String(email).trim(), hash(password), role]
    );
    if (instructor) {
      await conn.query(
        `INSERT INTO instructors (user_id, employee_number, first_name, last_name, academic_rank, department_id, gender, phone_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userResult.insertId, instructor.employee_number, instructor.first_name, instructor.last_name, instructor.academic_rank, instructor.department_id, instructor.gender, instructor.phone_number]
      );
    }
    await conn.commit();
    res.status(201).json({ message: `${role === 'instructor' ? 'Instructor' : 'Registrar'} account created`, user_id: userResult.insertId });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email or employee number already exists' });
    next(err);
  } finally {
    conn.release();
  }
};

/* =========================================================
   DEAN ACCOUNTS
   ========================================================= */
exports.listDeans = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cd.dean_id,cd.user_id,cd.employee_number,cd.first_name,cd.last_name,cd.gender,
        cd.phone_number,cd.academic_rank,cd.college_id,cd.office_location,cd.hire_date,cd.is_active,
        c.college_name,u.email,u.username
       FROM college_deans cd JOIN colleges c ON c.college_id=cd.college_id
       JOIN users u ON u.user_id=cd.user_id ORDER BY c.college_name`);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.createDean = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { email, password, employee_number, first_name, last_name, gender, phone_number, academic_rank, college_id, office_location, hire_date } = req.body;
    const ranks = ['Lecturer','Assistant Professor','Associate Professor','Professor'];
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 8 || typeof employee_number !== 'string' || !employee_number.trim() || employee_number.trim().length > 20 || typeof first_name !== 'string' || !first_name.trim() || first_name.trim().length > 50 || typeof last_name !== 'string' || !last_name.trim() || last_name.trim().length > 50 || !ranks.includes(academic_rank) || !Number.isInteger(Number(college_id)) || Number(college_id) < 1 || (gender && !['Male','Female'].includes(gender)) || (phone_number !== undefined && (typeof phone_number !== 'string' || phone_number.length > 15)) || (office_location !== undefined && (typeof office_location !== 'string' || office_location.length > 50)) || (hire_date && !/^\d{4}-\d{2}-\d{2}$/.test(hire_date))) return res.status(400).json({ message: 'Enter valid dean details, a supported academic rank, college, and password of at least 8 characters.' });
    await conn.beginTransaction();
    const [[college]] = await conn.query('SELECT college_id,dean_user_id FROM colleges WHERE college_id=? FOR UPDATE', [college_id]);
    if (!college) { await conn.rollback(); return res.status(400).json({ message: 'Choose a valid college.' }); }
    if (college.dean_user_id) {
      const [[oldDean]] = await conn.query('SELECT dean_id,user_id FROM college_deans WHERE user_id=? AND college_id=? FOR UPDATE', [college.dean_user_id, college_id]);
      if (oldDean) {
        await conn.query("INSERT INTO dean_audit_logs (college_id,dean_user_id,action,entity_type,entity_id,details) VALUES (?,?,'auto_demote','dean',?,JSON_OBJECT('reason','Reassigned by administrator'))", [college_id, oldDean.user_id, oldDean.dean_id]);
        await conn.query('UPDATE users SET college_id=NULL WHERE user_id=?', [oldDean.user_id]);
        await conn.query('DELETE FROM college_deans WHERE dean_id=?', [oldDean.dean_id]);
      }
    }
    const [[existing]] = await conn.query('SELECT user_id FROM users WHERE email=? LIMIT 1', [email.trim().toLowerCase()]);
    if (existing) { await conn.rollback(); return res.status(409).json({ message: 'Email already exists.' }); }
    const [[employee]] = await conn.query('SELECT instructor_id FROM instructors WHERE employee_number=? LIMIT 1', [employee_number.trim()]);
    if (employee) { await conn.rollback(); return res.status(409).json({ message: 'Employee number already exists.' }); }
    const [userResult] = await conn.query(
      'INSERT INTO users (username,first_name,last_name,email,password_hash,role,college_id) VALUES (?,?,?,?,?,?,?)',
      [generateUsername(employee_number.trim()), first_name.trim(), last_name.trim(), email.trim().toLowerCase(), hash(password), 'instructor', college_id]);
    await conn.query(
      `INSERT INTO instructors (user_id,employee_number,first_name,last_name,gender,phone_number,academic_rank,office_location,hire_date)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [userResult.insertId, employee_number.trim(), first_name.trim(), last_name.trim(), gender || null, phone_number?.trim() || null, academic_rank, office_location?.trim() || null, hire_date || null]);
    const [deanResult] = await conn.query(
      `INSERT INTO college_deans (user_id,employee_number,first_name,last_name,gender,phone_number,academic_rank,college_id,office_location,hire_date)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [userResult.insertId, employee_number.trim(), first_name.trim(), last_name.trim(), gender || null, phone_number?.trim() || null, academic_rank, college_id, office_location?.trim() || null, hire_date || null]);
    await conn.query('UPDATE colleges SET dean_user_id=?,dean_name=? WHERE college_id=?', [userResult.insertId, `${first_name.trim()} ${last_name.trim()}`, college_id]);
    await conn.commit();
    res.status(201).json({ message: 'Dean account created.', user_id: userResult.insertId, dean_id: deanResult.insertId, username: generateUsername(employee_number.trim()) });
  } catch (error) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email, username, or employee number already exists.' });
    next(error);
  } finally { conn.release(); }
};

exports.demoteDean = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const deanId = Number(req.params.id);
    if (!Number.isInteger(deanId) || deanId < 1) return res.status(400).json({ message: 'Invalid dean.' });
    await conn.beginTransaction();
    const [[dean]] = await conn.query('SELECT dean_id,user_id,college_id FROM college_deans WHERE dean_id=? FOR UPDATE', [deanId]);
    if (!dean) { await conn.rollback(); return res.status(404).json({ message: 'Dean not found.' }); }
    await conn.query("INSERT INTO dean_audit_logs (college_id,dean_user_id,action,entity_type,entity_id,details) VALUES (?,?,'demote','dean',?,JSON_OBJECT('reason','Administrator removed dean assignment'))", [dean.college_id, dean.user_id, dean.dean_id]);
    await conn.query('UPDATE colleges SET dean_user_id=NULL,dean_name=NULL WHERE college_id=? AND dean_user_id=?', [dean.college_id, dean.user_id]);
    await conn.query('UPDATE users SET college_id=NULL WHERE user_id=?', [dean.user_id]);
    await conn.query('DELETE FROM college_deans WHERE dean_id=?', [deanId]);
    await conn.commit();
    res.json({ message: 'Dean assignment removed. The instructor account remains active.' });
  } catch (error) { await conn.rollback(); next(error); }
  finally { conn.release(); }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    await db.query(
      'UPDATE users SET is_active = NOT is_active WHERE user_id = ?',
      [req.params.userId]
    );
    res.json({ message: 'User status toggled' });
  } catch (err) { next(err); }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin','registrar','instructor','student','finance'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await db.query('UPDATE users SET role = ? WHERE user_id = ?', [role, req.params.userId]);
    res.json({ message: 'Role updated' });
  } catch (err) { next(err); }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    await db.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [hash(password), req.params.userId]
    );
    res.json({ message: 'Password reset' });
  } catch (err) { next(err); }
};

/* =========================================================
   3. DEPARTMENTS
   ========================================================= */
exports.listDepartments = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, c.college_name,
        (SELECT COUNT(*) FROM students    s WHERE s.department_id = d.department_id) AS student_count,
        (SELECT COUNT(*) FROM instructors i WHERE i.department_id = d.department_id) AS instructor_count,
        (SELECT COUNT(*) FROM courses     c WHERE c.department_id = d.department_id) AS course_count
       FROM departments d LEFT JOIN colleges c ON c.college_id = d.college_id
       ORDER BY d.department_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { department_name, department_code, faculty, college_id, capacity, min_score, is_available_for_selection } = req.body;
    const capacityValue = Number(capacity ?? 50);
    const minScoreValue = Number(min_score ?? 0);
    const collegeIdValue = college_id ? Number(college_id) : null;
    if (!department_name?.trim() || !department_code?.trim()) {
      return res.status(400).json({ message: 'Department name and code are required' });
    }
    if (!Number.isInteger(capacityValue) || capacityValue < 1 || !Number.isFinite(minScoreValue) || minScoreValue < 0) {
      return res.status(400).json({ message: 'Capacity must be a positive whole number and minimum score cannot be negative' });
    }
    if (collegeIdValue !== null && (!Number.isInteger(collegeIdValue) || collegeIdValue < 1)) {
      return res.status(400).json({ message: 'Choose a valid college' });
    }
    await db.query(
      `INSERT INTO departments (department_name, department_code, faculty, college_id, capacity, min_score, is_available_for_selection)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [department_name.trim(), department_code.trim(), faculty?.trim() || null, collegeIdValue, capacityValue, minScoreValue, is_available_for_selection === false ? 0 : 1]
    );
    res.status(201).json({ message: 'Department created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Department code already exists' });
    }
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { department_name, department_code, faculty, college_id, capacity, min_score, is_available_for_selection } = req.body;
    const capacityValue = Number(capacity);
    const minScoreValue = Number(min_score);
    const collegeIdValue = college_id ? Number(college_id) : null;
    if (!department_name?.trim() || !department_code?.trim()) {
      return res.status(400).json({ message: 'Department name and code are required' });
    }
    if (!Number.isInteger(capacityValue) || capacityValue < 1 || !Number.isFinite(minScoreValue) || minScoreValue < 0) {
      return res.status(400).json({ message: 'Capacity must be a positive whole number and minimum score cannot be negative' });
    }
    if (collegeIdValue !== null && (!Number.isInteger(collegeIdValue) || collegeIdValue < 1)) {
      return res.status(400).json({ message: 'Choose a valid college' });
    }
    await db.query(
      `UPDATE departments
       SET department_name = ?, department_code = ?, faculty = ?, college_id = ?, capacity = ?, min_score = ?, is_available_for_selection = ?
       WHERE department_id = ?`,
      [department_name.trim(), department_code.trim(), faculty?.trim() || null, collegeIdValue, capacityValue, minScoreValue, is_available_for_selection ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Department updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Department code already exists' });
    next(err);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    /* Block deletion while operational records still depend on the department. */
    const [[linked]] = await db.query(
      `SELECT (SELECT COUNT(*) FROM students WHERE department_id = ?) AS students,
              (SELECT COUNT(*) FROM instructors WHERE department_id = ? OR hod_department_id = ?) AS instructors,
              (SELECT COUNT(*) FROM courses WHERE department_id = ?) AS courses`,
      [req.params.id, req.params.id, req.params.id, req.params.id]
    );
    if (Number(linked.students) + Number(linked.instructors) + Number(linked.courses) > 0) {
      return res.status(400).json({ message: 'Move or remove the department students, instructors, and courses before deleting it' });
    }
    await db.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (err) { next(err); }
};

/* =========================================================
   4. COURSES
   ========================================================= */
exports.listCourses = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, d.department_name
       FROM courses c
       JOIN departments d ON c.department_id = d.department_id
       ORDER BY c.course_code`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createCourse = async (req, res, next) => {
  try {
    const {
      course_code, course_title, credit_hours,
      department_id, year_level, semester, is_elective, category,
    } = req.body;

    if (!course_code || !course_title || !credit_hours || !department_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await db.query(
      `INSERT INTO courses
        (course_code, course_title, credit_hours, department_id,
         year_level, semester, is_elective, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_code, course_title, credit_hours, department_id,
        year_level || 1, semester || 'I',
        is_elective ? 1 : 0, category || 'Major Course',
      ]
    );
    res.status(201).json({ message: 'Course created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const {
      course_code, course_title, credit_hours,
      department_id, year_level, semester, is_elective, category,
    } = req.body;

    await db.query(
      `UPDATE courses
       SET course_code = ?, course_title = ?, credit_hours = ?,
           department_id = ?, year_level = ?, semester = ?,
           is_elective = ?, category = ?
       WHERE course_id = ?`,
      [
        course_code, course_title, credit_hours, department_id,
        year_level, semester, is_elective ? 1 : 0,
        category, req.params.id,
      ]
    );
    res.json({ message: 'Course updated' });
  } catch (err) { next(err); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const [[{ sCount }]] = await db.query(
      'SELECT COUNT(*) AS sCount FROM sections WHERE course_id = ?',
      [req.params.id]
    );
    if (sCount > 0) {
      return res.status(400).json({ message: 'Cannot delete: course has sections' });
    }
    await db.query('DELETE FROM courses WHERE course_id = ?', [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (err) { next(err); }
};

/* =========================================================
   5. SECTIONS
   ========================================================= */
exports.listSections = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sec.*, c.course_code, c.course_title,
              CONCAT(i.first_name,' ',i.last_name) AS instructor,
              (SELECT COUNT(*) FROM enrollments e
               WHERE e.section_id = sec.section_id AND e.status='Enrolled') AS enrolled
       FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       LEFT JOIN instructors i ON sec.instructor_id = i.instructor_id
       ORDER BY sec.academic_year DESC, c.course_code`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createSection = async (req, res, next) => {
  try {
    const {
      course_id, academic_year, semester,
      room, schedule, capacity,
    } = req.body;

    if (!course_id || !academic_year || !semester) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await db.query(
      `INSERT INTO sections
        (course_id, academic_year, semester, room, schedule, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        course_id, academic_year, semester,
        room || null, schedule || null, capacity || 50,
      ]
    );
    res.status(201).json({ message: 'Section created' });
  } catch (err) { next(err); }
};

exports.updateSection = async (req, res, next) => {
  try {
    const {
      course_id, academic_year, semester,
      room, schedule, capacity,
    } = req.body;
    await db.query(
      `UPDATE sections
       SET course_id = ?, academic_year = ?,
           semester = ?, room = ?, schedule = ?, capacity = ?
       WHERE section_id = ?`,
      [
        course_id, academic_year, semester,
        room, schedule, capacity, req.params.id,
      ]
    );
    res.json({ message: 'Section updated' });
  } catch (err) { next(err); }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const [[{ eCount }]] = await db.query(
      'SELECT COUNT(*) AS eCount FROM enrollments WHERE section_id = ?',
      [req.params.id]
    );
    if (eCount > 0) {
      return res.status(400).json({ message: 'Cannot delete: section has enrollments' });
    }
    await db.query('DELETE FROM sections WHERE section_id = ?', [req.params.id]);
    res.json({ message: 'Section deleted' });
  } catch (err) { next(err); }
};

/* =========================================================
   6. FIELDS
   ========================================================= */
exports.listFields = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, d.department_name,
        (SELECT COUNT(*) FROM field_selections fs WHERE fs.field_id = f.field_id) AS selection_count
       FROM fields f LEFT JOIN departments d ON d.department_id = f.department_id
       ORDER BY f.field_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createField = async (req, res, next) => {
  try {
    const { field_name, department_id } = req.body;
    if (!field_name) return res.status(400).json({ message: 'Field name required' });
    await db.query('INSERT INTO fields (field_name, department_id) VALUES (?, ?)', [field_name.trim(), department_id || null]);
    res.status(201).json({ message: 'Field created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Field already exists' });
    }
    next(err);
  }
};

exports.updateField = async (req, res, next) => {
  try {
    const { field_name, department_id } = req.body;
    if (!field_name?.trim()) return res.status(400).json({ message: 'Field name required' });
    await db.query('UPDATE fields SET field_name = ?, department_id = ? WHERE field_id = ?', [field_name.trim(), department_id || null, req.params.id]);
    res.json({ message: 'Field updated' });
  } catch (err) { next(err); }
};

exports.deleteField = async (req, res, next) => {
  try {
    const [[{ sCount }]] = await db.query(
      'SELECT COUNT(*) AS sCount FROM field_selections WHERE field_id = ?',
      [req.params.id]
    );
    if (sCount > 0) {
      return res.status(400).json({ message: 'Cannot delete: field has selections' });
    }
    await db.query('DELETE FROM fields WHERE field_id = ?', [req.params.id]);
    res.json({ message: 'Field deleted' });
  } catch (err) { next(err); }
};

/* =========================================================
   7. STUDENTS DIRECTORY
   ========================================================= */
exports.listStudents = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.student_id, s.student_number, s.first_name, s.last_name,
              s.gender, s.current_year, s.status, s.region,
              d.department_name, u.email
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.department_id
       LEFT JOIN users u ON s.user_id = u.user_id
       ORDER BY s.first_name, s.last_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   8. INSTRUCTORS DIRECTORY
   ========================================================= */
exports.listInstructors = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT i.instructor_id, i.employee_number, i.first_name, i.last_name,
              i.gender, i.academic_rank, i.is_hod, i.hod_department_id,
              d.department_name, u.email
       FROM instructors i
       LEFT JOIN departments d ON i.department_id = d.department_id
       LEFT JOIN users u ON i.user_id = u.user_id
       ORDER BY i.first_name, i.last_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.promoteToHod = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { instructor_id, department_id } = req.body;

    if (!instructor_id || !department_id) {
      await conn.rollback();
      return res.status(400).json({ message: 'instructor_id and department_id required' });
    }

    /* Demote existing HOD of that department (if any) */
    await conn.query(
      `UPDATE instructors
       SET is_hod = FALSE, hod_department_id = NULL
       WHERE hod_department_id = ?`,
      [department_id]
    );

    /* Promote */
    await conn.query(
      `UPDATE instructors
       SET is_hod = TRUE, hod_department_id = ?
       WHERE instructor_id = ?`,
      [department_id, instructor_id]
    );

    /* Sync departments.hod_user_id */
    const [[inst]] = await conn.query(
      'SELECT user_id FROM instructors WHERE instructor_id = ?',
      [instructor_id]
    );
    await conn.query(
      'UPDATE departments SET hod_user_id = ? WHERE department_id = ?',
      [inst.user_id, department_id]
    );

    await conn.commit();
    res.json({ message: 'HOD assigned' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.demoteHod = async (req, res, next) => {
  try {
    const { instructorId } = req.params;
    await db.query(
      `UPDATE instructors
       SET is_hod = FALSE, hod_department_id = NULL
       WHERE instructor_id = ?`,
      [instructorId]
    );
    res.json({ message: 'HOD removed' });
  } catch (err) { next(err); }
};

/* =========================================================
   9. SYSTEM SETTINGS (single-row config table)
   ========================================================= */
exports.getSettings = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, current_academic_year, current_semester, registration_open, field_selection_open,
              TO_CHAR(field_selection_start, 'YYYY-MM-DD"T"HH24:MI') AS field_selection_start,
              TO_CHAR(field_selection_end, 'YYYY-MM-DD"T"HH24:MI') AS field_selection_end
       FROM system_settings ORDER BY id LIMIT 1`
    );
    res.json(rows[0] || {});
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const {
      current_academic_year, current_semester,
      registration_open, field_selection_open,
      field_selection_start, field_selection_end,
    } = req.body;

    if (field_selection_start && field_selection_end && new Date(field_selection_end) <= new Date(field_selection_start)) {
      return res.status(400).json({ message: 'Selection end must be after the start date' });
    }

    await db.query(
      `INSERT INTO system_settings
        (id, current_academic_year, current_semester, registration_open, field_selection_open, field_selection_start, field_selection_end)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         current_academic_year = EXCLUDED.current_academic_year,
         current_semester      = EXCLUDED.current_semester,
         registration_open     = EXCLUDED.registration_open,
         field_selection_open  = EXCLUDED.field_selection_open,
         field_selection_start = EXCLUDED.field_selection_start,
         field_selection_end = EXCLUDED.field_selection_end`,
      [
        current_academic_year || '2025/2026',
        current_semester || 'I',
        Boolean(registration_open),
        Boolean(field_selection_open),
        field_selection_start || null,
        field_selection_end || null,
      ]
    );
    res.json({ message: 'Settings updated' });
  } catch (err) { next(err); }
};

/* =========================================================
   10. BULK PUBLISH RESULTS
   ========================================================= */
exports.bulkPublishResults = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [students] = await conn.query(
      `SELECT fs.student_id, fs.field_id
       FROM field_selections fs
       WHERE fs.priority = 1`
    );

    let count = 0;
    for (const s of students) {
      await conn.query(
        `INSERT INTO selection_results
          (student_id, field_id, status, announced_on)
         VALUES (?, ?, 'Assigned', CURRENT_DATE)
         ON CONFLICT (student_id) DO UPDATE SET
           field_id     = EXCLUDED.field_id,
           status       = EXCLUDED.status,
           announced_on = EXCLUDED.announced_on`,
        [s.student_id, s.field_id]
      );
      count++;
    }

    await conn.commit();
    res.json({ message: `Published ${count} results` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* =========================================================
   11. SYSTEM-WIDE REPORTS
   ========================================================= */
exports.getReport = async (req, res, next) => {
  try {
    const { type } = req.query; // students_by_dept | instructors_by_dept | enrollment_by_section | grade_distribution

    if (type === 'students_by_dept') {
      const [rows] = await db.query(
        `SELECT d.department_name, COUNT(s.student_id) AS total
         FROM departments d
         LEFT JOIN students s ON s.department_id = d.department_id
         GROUP BY d.department_id ORDER BY total DESC`
      );
      return res.json(rows);
    }

    if (type === 'instructors_by_dept') {
      const [rows] = await db.query(
        `SELECT d.department_name, COUNT(i.instructor_id) AS total
         FROM departments d
         LEFT JOIN instructors i ON i.department_id = d.department_id
         GROUP BY d.department_id ORDER BY total DESC`
      );
      return res.json(rows);
    }

    if (type === 'enrollment_by_section') {
      const [rows] = await db.query(
        `SELECT c.course_code, c.course_title, sec.semester, sec.academic_year,
                COUNT(e.enrollment_id) AS enrolled, sec.capacity
         FROM sections sec
         JOIN courses c ON sec.course_id = c.course_id
         LEFT JOIN enrollments e
           ON e.section_id = sec.section_id AND e.status = 'Enrolled'
         GROUP BY sec.section_id
         ORDER BY enrolled DESC`
      );
      return res.json(rows);
    }

    if (type === 'grade_distribution') {
      const [rows] = await db.query(
        `SELECT letter_grade, COUNT(*) AS total
         FROM grades
         GROUP BY letter_grade
         ORDER BY FIELD(letter_grade,'A+','A','A-','B+','B','B-','C+','C','C-','D','F')`
      );
      return res.json(rows);
    }

    if (type === 'allocation') {
      const [rows] = await db.query(
        `SELECT s.student_number, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                s.university_entrance_result AS total_score, d.department_code, d.department_name,
                sr.status, sr.announced_on
         FROM selection_results sr JOIN students s ON s.student_id = sr.student_id
         LEFT JOIN departments d ON d.department_id = sr.department_id
         ORDER BY d.department_name, s.student_number`
      );
      return res.json(rows);
    }

    if (type === 'grades') {
      const [rows] = await db.query(
        `SELECT s.student_number, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                c.course_code, c.course_title, g.total_mark, g.letter_grade, g.grade_point
         FROM grades g JOIN enrollments e ON e.enrollment_id = g.enrollment_id
         JOIN students s ON s.student_id = e.student_id
         JOIN sections sec ON sec.section_id = e.section_id
         JOIN courses c ON c.course_id = sec.course_id
         ORDER BY s.student_number, c.course_code`
      );
      return res.json(rows);
    }

    res.json([]);
  } catch (err) { next(err); }
};

/* =========================================================
   12. LOGIN AUDIT LOG
   ========================================================= */
exports.getLoginLog = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT log_id, user_id, email, role, ip_address, user_agent, logged_in_at
       FROM login_log ORDER BY logged_in_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    // If table doesn't exist yet, return empty
    res.json([]);
  }
};

exports.getSmsLog = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT l.sms_log_id, l.phone_number, l.message, l.status, l.provider_response, l.created_at,
              s.student_number, CONCAT(s.first_name, ' ', s.last_name) AS student_name
       FROM sms_logs l LEFT JOIN students s ON s.student_id = l.student_id
       ORDER BY l.created_at DESC LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    next(err);
  }
};

exports.runAllocation = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[settings]] = await conn.query(
      `SELECT field_selection_open, field_selection_end IS NOT NULL AND field_selection_end > NOW() AS selection_not_ended
       FROM system_settings ORDER BY id LIMIT 1`
    );
    if (settings?.field_selection_open && settings.selection_not_ended) {
      await conn.rollback();
      return res.status(400).json({ message: 'Close the student selection window before running allocation' });
    }

    const [students] = await conn.query(
      `SELECT s.student_id, s.university_entrance_result AS total_score,
              fs.field_id, fs.priority, f.department_id, d.capacity, d.min_score
       FROM students s JOIN field_selections fs ON fs.student_id = s.student_id
       JOIN fields f ON f.field_id = fs.field_id
       JOIN departments d ON d.department_id = f.department_id AND d.is_available_for_selection = TRUE
       ORDER BY s.university_entrance_result DESC, s.student_id, fs.priority`
    );
    const grouped = new Map();
    for (const row of students) {
      const list = grouped.get(row.student_id) || [];
      list.push(row);
      grouped.set(row.student_id, list);
    }
    const capacityByDepartment = new Map();
    await conn.query('DELETE FROM selection_results');
    let assigned = 0;
    let unassigned = 0;
    for (const [studentId, preferences] of grouped) {
      const score = Number(preferences[0].total_score || 0);
      let choice = null;
      for (const pref of preferences.sort((a, b) => a.priority - b.priority)) {
        if (score < Number(pref.min_score || 0)) continue;
        const used = capacityByDepartment.get(pref.department_id) || 0;
        if (used < Number(pref.capacity)) { choice = pref; break; }
      }
      if (!choice) { unassigned++; continue; }
      capacityByDepartment.set(choice.department_id, (capacityByDepartment.get(choice.department_id) || 0) + 1);
      await conn.query(
        `INSERT INTO selection_results (student_id, field_id, department_id, status, announced_on)
         VALUES (?, ?, ?, 'Assigned', CURRENT_DATE)`,
        [studentId, choice.field_id, choice.department_id]
      );
      assigned++;
    }
    await conn.commit();
    res.json({ message: 'Allocation completed', assigned, unassigned });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally { conn.release(); }
};
