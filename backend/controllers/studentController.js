const db = require('../config/db');
const { calculateGPA } = require('../utils/calculateGPA');

// ---------- MY PROFILE ----------
exports.getMyProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.student_number,
              CONCAT_WS(' ', s.first_name, s.last_name, s.grandfather_name) AS full_name,
              s.first_name, s.last_name, s.grandfather_name, s.gender,
              s.date_of_birth, s.phone_number, s.region,
              s.campus, s.building_no, s.building_name, s.floor, s.dorm, s.bed_no,
              s.handicapped_case, s.university_entrance_result,
              s.university_entrance_result AS total_score,
              s.current_year, s.status, s.dormitory, s.admission_year,
              d.department_name, u.email
       FROM students s
       JOIN users u ON u.user_id = s.user_id
       LEFT JOIN departments d ON d.department_id = s.department_id
       WHERE s.student_id = ?`,
      [req.user.student_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student profile not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// ---------- MY COURSES ----------
exports.getMyCourses = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const [rows] = await db.query(
      `SELECT c.course_code, c.course_title, c.credit_hours,
              CONCAT(i.first_name,' ',i.last_name) AS instructor,
              sec.room, sec.schedule
       FROM enrollments e
       JOIN sections sec   ON e.section_id = sec.section_id
       JOIN courses c      ON sec.course_id = c.course_id
       LEFT JOIN instructors i ON sec.instructor_id = i.instructor_id
       WHERE e.student_id = ? AND e.status = 'Enrolled'`,
      [studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// ---------- MY GRADES ----------
exports.getMyGrades = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const [rows] = await db.query(
      `SELECT c.course_code, c.course_title, c.credit_hours,
              g.total_mark, g.letter_grade, g.grade_point
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.section_id
       JOIN courses c    ON sec.course_id = c.course_id
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id
       WHERE e.student_id = ?`,
      [studentId]
    );

    const cgpa = calculateGPA(
      rows.filter(r => r.grade_point !== null)
          .map(r => ({ credit_hours: r.credit_hours, grade_point: r.grade_point }))
    );

    res.json({ courses: rows, cgpa });
  } catch (err) { next(err); }
};

// ---------- MY STATUS ----------
exports.getMyStatus = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const [rows] = await db.query(
      `SELECT s.current_year, s.status, s.dormitory, s.student_number,
              d.department_name,
              IFNULL(AVG(g.grade_point), 0) AS cgpa,
              IFNULL(SUM(c.credit_hours), 0) AS total_credit
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.department_id
       LEFT JOIN enrollments e ON e.student_id = s.student_id
       LEFT JOIN sections sec  ON e.section_id = sec.section_id
       LEFT JOIN courses c     ON sec.course_id = c.course_id
       LEFT JOIN grades g      ON g.enrollment_id = e.enrollment_id
       WHERE s.student_id = ?
       GROUP BY s.student_id`,
      [studentId]
    );
    res.json(rows[0] || {});
  } catch (err) { next(err); }
};

// ---------- MY DORMITORY ----------
exports.getMyDormitory = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT dormitory, campus, building_no, building_name, floor, dorm, bed_no
       FROM students
       WHERE student_id = ?`,
      [req.user.student_id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Student dormitory information not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// ---------- PLACEMENT TUTORIALS ----------
exports.getPlacementTutorials = async (req, res) => {
  res.json([
    { title: 'How to Use the Placement Portal', url: 'https://inu.edu.et/tutorials/placement' },
    { title: 'Field Selection Guide 2026',       url: 'https://inu.edu.et/tutorials/field' },
    { title: 'Understanding Priority Summary',   url: 'https://inu.edu.et/tutorials/priority' },
    { title: 'Rules for Field Assignment',       url: 'https://inu.edu.et/tutorials/rules' },
  ]);
};

// ---------- AVAILABLE FIELDS ----------
exports.getAvailableFields = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT f.field_id, f.field_name, f.department_id, d.department_name, d.capacity, d.min_score
       FROM fields f JOIN departments d ON d.department_id = f.department_id
       WHERE d.is_available_for_selection = 1 ORDER BY d.department_name, f.field_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// ---------- SAVE FIELD SELECTIONS ----------
exports.selectFields = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const studentId = req.user.student_id;
    const { fields } = req.body; // array of field_id in priority order

    if (!Array.isArray(fields) || fields.length === 0 || fields.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      return res.status(400).json({ message: 'At least one field required' });
    }
    if (fields.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 fields allowed' });
    }

    if (new Set(fields.map(Number)).size !== fields.length) return res.status(400).json({ message: 'A field can only be selected once' });
    const [[settings]] = await conn.query(
      `SELECT field_selection_open,
              field_selection_start IS NULL OR field_selection_start <= NOW() AS selection_started,
              field_selection_end IS NULL OR field_selection_end >= NOW() AS selection_not_ended
       FROM system_settings ORDER BY id LIMIT 1`
    );
    if (!settings || !settings.field_selection_open || !settings.selection_started || !settings.selection_not_ended) {
      return res.status(403).json({ message: 'Department selection is currently closed' });
    }
    await conn.beginTransaction();
    const [valid] = await conn.query(`SELECT f.field_id FROM fields f JOIN departments d ON d.department_id = f.department_id
      WHERE f.field_id IN (?) AND d.is_available_for_selection = 1`, [fields]);
    if (valid.length !== fields.length) { await conn.rollback(); return res.status(400).json({ message: 'One or more selected fields do not exist' }); }
    await conn.query('DELETE FROM field_selections WHERE student_id = ?', [studentId]);

    for (let i = 0; i < fields.length; i++) {
      await conn.query(
        `INSERT INTO field_selections (student_id, field_id, priority)
         VALUES (?, ?, ?)`,
        [studentId, fields[i], i + 1]
      );
    }

    await conn.commit();
    res.json({ message: 'Field selection saved successfully' });
  } catch (err) { try { await conn.rollback(); } catch {} next(err); }
  finally { conn.release(); }
};

// ---------- SELECTION RESULTS ----------
exports.getSelectionResults = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const [rows] = await db.query(
      `SELECT COALESCE(d.department_name, f.field_name) AS assigned_field,
              sr.status, sr.announced_on
       FROM selection_results sr
       LEFT JOIN fields f ON sr.field_id = f.field_id
       LEFT JOIN departments d ON sr.department_id = d.department_id
       WHERE sr.student_id = ?
       LIMIT 1`,
      [studentId]
    );
    res.json(rows[0] || {
      assigned_field: 'Pending',
      status: 'Not announced',
      announced_on: null,
    });
  } catch (err) { next(err); }
};

// ---------- PRIORITY SUMMARY (used in popup) ----------
exports.getPrioritySummary = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const [rows] = await db.query(
      `SELECT f.field_id, COALESCE(d.department_name, f.field_name) AS field_name, fs.priority,
              IF(sr.field_id = fs.field_id, 'Assigned', 'Not Assigned') AS status
       FROM field_selections fs
       JOIN fields f ON fs.field_id = f.field_id
       LEFT JOIN departments d ON d.department_id = f.department_id
       LEFT JOIN selection_results sr ON sr.student_id = fs.student_id
       WHERE fs.student_id = ?
       ORDER BY fs.priority ASC`,
      [studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};
