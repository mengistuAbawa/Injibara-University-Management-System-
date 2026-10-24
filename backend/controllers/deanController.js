/** College-scoped dean analytics, department curriculum, and grade approval endpoints. */
const db = require('../config/db');

const collegeId = (req) => Number(req.user.college_id);
const validId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const audit = (conn, req, action, type, id, details = null) => conn.query(
  'INSERT INTO dean_audit_logs (college_id, dean_user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
  [collegeId(req), req.user.id, action, type, id || null, details ? JSON.stringify(details) : null]);

exports.getOverview = async (req, res, next) => {
  try {
    const id = collegeId(req);
    const [[counts]] = await db.query(
      `SELECT COUNT(DISTINCT d.department_id) AS departments,
              COUNT(DISTINCT s.student_id) AS students,
              COUNT(DISTINCT i.instructor_id) AS instructors,
              COUNT(DISTINCT c.course_id) AS courses
       FROM departments d LEFT JOIN students s ON s.department_id=d.department_id
       LEFT JOIN courses c ON c.department_id=d.department_id
       LEFT JOIN instructors i ON i.department_id=d.department_id WHERE d.college_id=?`, [id]);
    const [[metrics]] = await db.query(
      `SELECT ROUND(SUM(CASE WHEN g.approval_status='Approved' AND g.grade_point IS NOT NULL THEN g.grade_point*c.credit_hours END)/
                NULLIF(SUM(CASE WHEN g.approval_status='Approved' AND g.grade_point IS NOT NULL THEN c.credit_hours END),0),2) AS college_gpa,
              ROUND(100*SUM(CASE WHEN g.approval_status='Approved' AND g.letter_grade IN ('A','A-','B+','B','C+','C','D') THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN g.approval_status='Approved' AND g.letter_grade IS NOT NULL AND g.letter_grade NOT IN ('NG','I') THEN 1 ELSE 0 END),0),2) AS pass_rate
       FROM departments d JOIN courses c ON c.department_id=d.department_id
       JOIN sections sec ON sec.course_id=c.course_id JOIN enrollments e ON e.section_id=sec.section_id
       JOIN grades g ON g.enrollment_id=e.enrollment_id WHERE d.college_id=?`, [id]);
    const [[pending]] = await db.query("SELECT COUNT(*) AS pending_approvals FROM grade_upload_approvals WHERE college_id=? AND status='Pending'", [id]);
    const [[college]] = await db.query('SELECT college_name FROM colleges WHERE college_id=?', [id]);
    res.json({ ...counts, ...metrics, ...pending, average_gpa: metrics.college_gpa, failure_rate: metrics.pass_rate == null ? null : Number((100 - metrics.pass_rate).toFixed(2)), college_name: college?.college_name || '' });
  } catch (error) { next(error); }
};

exports.getStatistics = async (req, res, next) => {
  try {
    const [departments] = await db.query(
      `SELECT d.department_id, d.department_name,
        ROUND(SUM(CASE WHEN g.approval_status='Approved' THEN g.grade_point*c.credit_hours END)/NULLIF(SUM(CASE WHEN g.approval_status='Approved' THEN c.credit_hours END),0),2) AS average_gpa,
        SUM(CASE WHEN g.approval_status='Approved' AND g.letter_grade='F' THEN 1 ELSE 0 END) AS failures,
        COUNT(CASE WHEN g.approval_status='Approved' AND g.letter_grade IS NOT NULL AND g.letter_grade NOT IN ('NG','I') THEN 1 END) AS graded
       FROM departments d LEFT JOIN courses c ON c.department_id=d.department_id
       LEFT JOIN sections sec ON sec.course_id=c.course_id LEFT JOIN enrollments e ON e.section_id=sec.section_id
       LEFT JOIN grades g ON g.enrollment_id=e.enrollment_id WHERE d.college_id=?
       GROUP BY d.department_id ORDER BY d.department_name`, [collegeId(req)]);
    const [distribution] = await db.query(
      `SELECT g.letter_grade, COUNT(*) AS count FROM grades g JOIN enrollments e ON e.enrollment_id=g.enrollment_id
       JOIN sections sec ON sec.section_id=e.section_id JOIN courses c ON c.course_id=sec.course_id
       JOIN departments d ON d.department_id=c.department_id
       WHERE d.college_id=? AND g.approval_status='Approved' GROUP BY g.letter_grade
       ORDER BY FIELD(g.letter_grade,'A','A-','B+','B','C+','C','D','F','NG','I')`, [collegeId(req)]);
    const rows = departments.map((row) => ({ ...row, failure_rate: Number(row.graded) ? Number((100 * row.failures / row.graded).toFixed(2)) : 0 }));
    const validDistribution = distribution.filter((row) => row.letter_grade && !['NG','I'].includes(row.letter_grade));
    const total = validDistribution.reduce((sum, row) => sum + Number(row.count), 0);
    const passed = distribution.filter((row) => ['A','A-','B+','B','C+','C','D'].includes(row.letter_grade)).reduce((sum, row) => sum + Number(row.count), 0);
    const [[collegeMetric]] = await db.query(`SELECT ROUND(SUM(CASE WHEN g.approval_status='Approved' THEN g.grade_point*c.credit_hours END)/NULLIF(SUM(CASE WHEN g.approval_status='Approved' THEN c.credit_hours END),0),2) AS college_gpa
      FROM departments d JOIN courses c ON c.department_id=d.department_id JOIN sections sec ON sec.course_id=c.course_id
      JOIN enrollments e ON e.section_id=sec.section_id JOIN grades g ON g.enrollment_id=e.enrollment_id WHERE d.college_id=?`, [collegeId(req)]);
    res.json({ college_gpa: collegeMetric.college_gpa ?? 0, pass_rate: total ? Number((100 * passed / total).toFixed(2)) : 0, failure_rate: total ? Number((100 * validDistribution.filter((row) => row.letter_grade === 'F').reduce((sum, row) => sum + Number(row.count), 0) / total).toFixed(2)) : 0, departments: rows, grade_distribution: distribution });
  } catch (error) { next(error); }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT d.department_id,d.department_name,d.department_code,d.faculty,d.capacity,d.min_score,d.is_available_for_selection,
        COUNT(DISTINCT s.student_id) AS student_count,COUNT(DISTINCT i.instructor_id) AS instructor_count,
        COUNT(DISTINCT c.course_id) AS course_count
       FROM departments d LEFT JOIN students s ON s.department_id=d.department_id
       LEFT JOIN instructors i ON i.department_id=d.department_id LEFT JOIN courses c ON c.department_id=d.department_id
       WHERE d.college_id=? GROUP BY d.department_id ORDER BY d.department_name`, [collegeId(req)]);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.createDepartment = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { department_name, department_code, faculty } = req.body;
    if (typeof department_name !== 'string' || !department_name.trim() || department_name.trim().length > 100 || typeof department_code !== 'string' || !/^[A-Za-z0-9-]{2,10}$/.test(department_code.trim()) || (faculty !== undefined && (typeof faculty !== 'string' || faculty.length > 100))) return res.status(400).json({ message: 'Enter a department name (max 100 characters) and a code (2–10 letters, numbers, or hyphens).' });
    await conn.beginTransaction();
    const [result] = await conn.query('INSERT INTO departments (department_name,department_code,faculty,college_id) VALUES (?,?,?,?)', [department_name.trim(), department_code.trim().toUpperCase(), faculty?.trim() || null, collegeId(req)]);
    await audit(conn, req, 'create', 'department', result.insertId, { department_name: department_name.trim() });
    await conn.commit();
    res.status(201).json({ department_id: result.insertId, message: 'Department created.' });
  } catch (error) { await conn.rollback(); if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Department name or code already exists.' }); next(error); }
  finally { conn.release(); }
};

exports.updateDepartment = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { department_name, department_code, faculty, is_available_for_selection } = req.body;
    if (!validId(req.params.id) || typeof department_name !== 'string' || !department_name.trim() || department_name.trim().length > 100 || typeof department_code !== 'string' || !/^[A-Za-z0-9-]{2,10}$/.test(department_code.trim()) || (faculty !== undefined && (typeof faculty !== 'string' || faculty.length > 100)) || (is_available_for_selection !== undefined && typeof is_available_for_selection !== 'boolean')) return res.status(400).json({ message: 'Valid department name and code are required.' });
    await conn.beginTransaction();
    const [own] = await conn.query('SELECT department_id FROM departments WHERE department_id=? AND college_id=? FOR UPDATE', [req.params.id, collegeId(req)]);
    if (!own.length) { await conn.rollback(); return res.status(403).json({ message: 'Department is outside your college.' }); }
    await conn.query('UPDATE departments SET department_name=?,department_code=?,faculty=?,is_available_for_selection=? WHERE department_id=? AND college_id=?', [department_name.trim(), department_code.trim().toUpperCase(), faculty?.trim() || null, is_available_for_selection === false ? 0 : 1, req.params.id, collegeId(req)]);
    await audit(conn, req, 'update', 'department', req.params.id);
    await conn.commit(); res.json({ message: 'Department updated.' });
  } catch (error) { await conn.rollback(); if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Department name or code already exists.' }); next(error); }
  finally { conn.release(); }
};

exports.getCourses = async (req, res, next) => {
  try {
    const params = [collegeId(req)];
    let where = 'd.college_id=?';
    if (req.query.department_id) { if (!validId(req.query.department_id)) return res.status(400).json({ message: 'Invalid department.' }); where += ' AND c.department_id=?'; params.push(req.query.department_id); }
    const [rows] = await db.query(`SELECT c.course_id,c.course_code,c.course_title,c.credit_hours,c.department_id,c.year_level,c.semester,d.department_name FROM courses c JOIN departments d ON d.department_id=c.department_id WHERE ${where} ORDER BY d.department_name,c.course_code`, params);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.getOfferings = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid department.' });
    const [own] = await db.query('SELECT 1 FROM departments WHERE department_id=? AND college_id=?', [req.params.id, collegeId(req)]);
    if (!own.length) return res.status(403).json({ message: 'Department is outside your college.' });
    const conditions = ['o.department_id=?']; const params = [req.params.id];
    if (req.query.academic_year) { if (!/^\d{4}\/\d{4}$/.test(req.query.academic_year)) return res.status(400).json({ message: 'Invalid academic year.' }); conditions.push('o.academic_year=?'); params.push(req.query.academic_year); }
    if (req.query.semester) { if (!['I','II','Summer'].includes(req.query.semester)) return res.status(400).json({ message: 'Invalid semester.' }); conditions.push('o.semester=?'); params.push(req.query.semester); }
    const [rows] = await db.query(`SELECT o.*,c.course_code,c.course_title,c.credit_hours,d.department_name,
      (SELECT COUNT(*) FROM sections sec WHERE sec.course_id=o.course_id AND sec.academic_year=o.academic_year AND sec.semester=o.semester) AS sections
      FROM department_offerings o JOIN courses c ON c.course_id=o.course_id JOIN departments d ON d.department_id=o.department_id
      WHERE ${conditions.join(' AND ')} ORDER BY o.year_level,c.course_code`, params);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.createOffering = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { course_id, year_level, semester, academic_year } = req.body;
    if (!validId(req.params.id) || !validId(course_id) || !Number.isInteger(Number(year_level)) || Number(year_level)<1 || Number(year_level)>5 || !['I','II','Summer'].includes(semester) || typeof academic_year !== 'string' || !/^\d{4}\/\d{4}$/.test(academic_year)) return res.status(400).json({ message: 'Choose a course, year level 1–5, semester, and academic year (YYYY/YYYY).' });
    await conn.beginTransaction();
    const [department] = await conn.query('SELECT department_id FROM departments WHERE department_id=? AND college_id=? FOR UPDATE', [req.params.id, collegeId(req)]);
    const [course] = await conn.query('SELECT course_id,year_level FROM courses WHERE course_id=? AND department_id=?', [course_id, req.params.id]);
    if (!department.length || !course.length) { await conn.rollback(); return res.status(403).json({ message: 'Choose a course from a department in your college.' }); }
    if (Number(course[0].year_level) !== Number(year_level)) { await conn.rollback(); return res.status(400).json({ message: 'Year level must match the course curriculum.' }); }
    const [result] = await conn.query('INSERT INTO department_offerings (department_id,course_id,year_level,semester,academic_year,created_by) VALUES (?,?,?,?,?,?)', [req.params.id, course_id, year_level, semester, academic_year, req.user.id]);
    await audit(conn, req, 'create', 'offering', result.insertId, { course_id: Number(course_id), year_level: Number(year_level), semester, academic_year });
    await conn.commit(); res.status(201).json({ offering_id: result.insertId, message: 'Course offering created.' });
  } catch (error) { await conn.rollback(); if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This course is already offered for that year and semester.' }); next(error); }
  finally { conn.release(); }
};

exports.deleteOffering = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    if (!validId(req.params.offeringId)) return res.status(400).json({ message: 'Invalid offering.' });
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT o.*,d.college_id FROM department_offerings o JOIN departments d ON d.department_id=o.department_id WHERE o.offering_id=? FOR UPDATE', [req.params.offeringId]);
    if (!rows.length || Number(rows[0].college_id) !== collegeId(req)) { await conn.rollback(); return res.status(403).json({ message: 'Offering is outside your college.' }); }
    const offer = rows[0];
    const [sections] = await conn.query('SELECT section_id FROM sections WHERE course_id=? AND academic_year=? AND semester=? LIMIT 1', [offer.course_id, offer.academic_year, offer.semester]);
    if (sections.length) { await conn.rollback(); return res.status(409).json({ message: 'This offering has sections and cannot be deleted.' }); }
    await conn.query('DELETE FROM department_offerings WHERE offering_id=?', [offer.offering_id]);
    await audit(conn, req, 'delete', 'offering', offer.offering_id);
    await conn.commit(); res.json({ message: 'Offering deleted.' });
  } catch (error) { await conn.rollback(); next(error); }
  finally { conn.release(); }
};

exports.getPendingGrades = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT a.approval_id,a.section_id,a.status,a.submitted_at,a.dean_note,
        c.course_code,c.course_title,sec.academic_year,sec.semester,sec.room,
        CONCAT(i.first_name,' ',i.last_name) AS instructor,
        (SELECT COUNT(*) FROM enrollments e WHERE e.section_id=sec.section_id AND e.status='Enrolled') AS students
       FROM grade_upload_approvals a JOIN sections sec ON sec.section_id=a.section_id
       JOIN courses c ON c.course_id=sec.course_id JOIN instructors i ON i.instructor_id=a.instructor_id
       WHERE a.college_id=? AND a.status='Pending'
       ORDER BY a.submitted_at`, [collegeId(req)]);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.reviewGradeUpload = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { action, note = '' } = req.body;
    if (!validId(req.params.sectionId) || !['approve','reject'].includes(action) || typeof note !== 'string' || note.length > 2000 || (action === 'reject' && !note.trim())) return res.status(400).json({ message: 'Choose approve or reject and provide a rejection note under 2000 characters.' });
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT * FROM grade_upload_approvals WHERE section_id=? AND college_id=? AND status='Pending' FOR UPDATE", [req.params.sectionId, collegeId(req)]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: 'Pending grade upload not found in your college.' }); }
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    await conn.query('UPDATE grade_upload_approvals SET status=?,dean_note=?,reviewed_by=?,reviewed_at=NOW() WHERE section_id=? AND college_id=?', [status, note.trim() || null, req.user.id, req.params.sectionId, collegeId(req)]);
    if (action === 'approve') await conn.query("UPDATE grades g SET finalized=TRUE,finalized_at=NOW(),finalized_by=?,approval_status='Approved' FROM enrollments e WHERE e.enrollment_id=g.enrollment_id AND e.section_id=?", [req.user.id, req.params.sectionId]);
    else await conn.query("UPDATE grades g SET approval_status='Rejected',finalized=FALSE,finalized_at=NULL,finalized_by=NULL FROM enrollments e WHERE e.enrollment_id=g.enrollment_id AND e.section_id=?", [req.params.sectionId]);
    await audit(conn, req, action, 'grade_upload', req.params.sectionId, { note: note.trim() || null });
    await conn.commit(); res.json({ message: `Grade upload ${status.toLowerCase()}.` });
  } catch (error) { await conn.rollback(); next(error); }
  finally { conn.release(); }
};

exports.getAllocationResults = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT s.student_id,s.student_number,s.first_name,s.last_name,d.department_name,f.field_name,sr.status,sr.announced_on
      FROM selection_results sr JOIN students s ON s.student_id=sr.student_id
      LEFT JOIN fields f ON f.field_id=sr.field_id LEFT JOIN departments d ON d.department_id=COALESCE(sr.department_id,f.department_id)
      WHERE d.college_id=? ORDER BY d.department_name,s.last_name,s.first_name`, [collegeId(req)]);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.getNgStudents = async (req, res, next) => {
  try {
    const params = [collegeId(req)]; let department = '';
    if (req.query.department_id) { if (!validId(req.query.department_id)) return res.status(400).json({ message: 'Invalid department.' }); department=' AND d.department_id=?'; params.push(req.query.department_id); }
    const [rows] = await db.query(`SELECT DISTINCT s.student_id,s.student_number,s.first_name,s.last_name,d.department_name,c.course_code,c.course_title,sec.semester,sec.academic_year,CONCAT(i.first_name,' ',i.last_name) AS instructor
      FROM students s JOIN departments d ON d.department_id=s.department_id JOIN enrollments e ON e.student_id=s.student_id
      JOIN sections sec ON sec.section_id=e.section_id JOIN courses c ON c.course_id=sec.course_id LEFT JOIN instructors i ON i.instructor_id=sec.instructor_id
      LEFT JOIN grades g ON g.enrollment_id=e.enrollment_id WHERE d.college_id=?${department} AND (g.letter_grade IS NULL OR g.letter_grade='NG') ORDER BY d.department_name,s.last_name`, params);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.getTopStudents = async (req, res, next) => {
  try {
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: 'Limit must be from 1 to 100.' });
    const [rows] = await db.query(`SELECT s.student_id,s.student_number,s.first_name,s.last_name,d.department_name,
      ROUND(SUM(g.grade_point*c.credit_hours)/NULLIF(SUM(c.credit_hours),0),2) AS cgpa,SUM(c.credit_hours) AS credits
      FROM students s JOIN departments d ON d.department_id=s.department_id JOIN enrollments e ON e.student_id=s.student_id
      JOIN sections sec ON sec.section_id=e.section_id JOIN courses c ON c.course_id=sec.course_id JOIN grades g ON g.enrollment_id=e.enrollment_id
      WHERE d.college_id=? AND g.approval_status='Approved' AND g.grade_point IS NOT NULL
      GROUP BY s.student_id,d.department_name ORDER BY cgpa DESC,s.last_name LIMIT ?`, [collegeId(req), limit]);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.getHods = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT i.instructor_id,i.employee_number,i.first_name,i.last_name,i.academic_rank,i.phone_number,d.department_id,d.department_name
      FROM instructors i JOIN departments d ON d.department_id=i.hod_department_id
      WHERE i.is_hod=TRUE AND d.college_id=? ORDER BY d.department_name`, [collegeId(req)]);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.getHodPerformance = async (req, res, next) => {
  try {
    if (!validId(req.params.instructorId)) return res.status(400).json({ message: 'Invalid HOD.' });
    const [rows] = await db.query(`SELECT c.course_code,c.course_title,COUNT(DISTINCT sec.section_id) AS sections,COUNT(g.grade_id) AS grades,
      ROUND(AVG(CASE WHEN g.approval_status='Approved' THEN g.grade_point END),2) AS average_gpa,
      SUM(CASE WHEN g.approval_status='Approved' AND g.letter_grade='F' THEN 1 ELSE 0 END) AS failures
      FROM instructors i JOIN departments d ON d.department_id=i.hod_department_id LEFT JOIN courses c ON c.department_id=d.department_id
      LEFT JOIN sections sec ON sec.course_id=c.course_id LEFT JOIN enrollments e ON e.section_id=sec.section_id LEFT JOIN grades g ON g.enrollment_id=e.enrollment_id
      WHERE i.instructor_id=? AND i.is_hod=TRUE AND d.college_id=? GROUP BY c.course_id ORDER BY c.course_code`, [req.params.instructorId, collegeId(req)]);
    if (!rows.length) { const [[own]] = await db.query('SELECT 1 AS ok FROM instructors i JOIN departments d ON d.department_id=i.hod_department_id WHERE i.instructor_id=? AND i.is_hod=TRUE AND d.college_id=?', [req.params.instructorId, collegeId(req)]); if (!own) return res.status(403).json({ message: 'HOD is outside your college.' }); }
    res.json(rows);
  } catch (error) { next(error); }
};

// Compatibility handlers for the original dean dashboard endpoints.
exports.getPerformance = async (req, res, next) => {
  req.query.limit = 20;
  try {
    const [rows] = await db.query(`SELECT d.department_id,d.department_name,CONCAT(i.first_name,' ',i.last_name) AS head_name,
      ROUND(AVG(CASE WHEN g.approval_status='Approved' THEN g.grade_point END),2) AS average_gpa,
      SUM(CASE WHEN g.approval_status='Approved' AND g.letter_grade='F' THEN 1 ELSE 0 END) AS failures,
      COUNT(CASE WHEN g.approval_status='Approved' AND g.letter_grade NOT IN ('NG','I') THEN 1 END) AS graded
      FROM departments d LEFT JOIN instructors i ON i.hod_department_id=d.department_id AND i.is_hod=TRUE
      LEFT JOIN courses c ON c.department_id=d.department_id LEFT JOIN sections sec ON sec.course_id=c.course_id
      LEFT JOIN enrollments e ON e.section_id=sec.section_id LEFT JOIN grades g ON g.enrollment_id=e.enrollment_id
      WHERE d.college_id=? GROUP BY d.department_id ORDER BY d.department_name`, [collegeId(req)]);
    res.json(rows.map((row) => ({ ...row, failure_rate: Number(row.graded) ? Number((100*row.failures/row.graded).toFixed(2)) : 0 })));
  } catch (error) { next(error); }
};
exports.getAllocation = exports.getAllocationResults;
exports.reviewGrade = async (req,res,next) => {
  try {
    const [[row]] = await db.query(`SELECT e.section_id FROM grades g JOIN enrollments e ON e.enrollment_id=g.enrollment_id
      JOIN sections sec ON sec.section_id=e.section_id JOIN courses c ON c.course_id=sec.course_id
      JOIN departments d ON d.department_id=c.department_id WHERE g.grade_id=? AND d.college_id=?`, [req.params.gradeId, collegeId(req)]);
    if (!row) return res.status(404).json({ message: 'Grade not found in your college.' });
    req.params.sectionId = row.section_id;
    req.body.action = req.body.decision;
    return exports.reviewGradeUpload(req,res,next);
  } catch (error) { next(error); }
};
