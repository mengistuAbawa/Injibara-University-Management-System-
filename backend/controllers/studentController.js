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
              c.year_level, c.semester, c.category, c.is_elective,
              sec.academic_year, sec.semester AS section_semester,
              CONCAT(i.first_name,' ',i.last_name) AS instructor,
              sec.room, sec.schedule
       FROM enrollments e
       JOIN sections sec   ON e.section_id = sec.section_id
       JOIN courses c      ON sec.course_id = c.course_id
       LEFT JOIN instructors i ON sec.instructor_id = i.instructor_id
       WHERE e.student_id = ? AND e.status = 'Enrolled'
       ORDER BY c.year_level, COALESCE(sec.semester, c.semester), c.course_code`,
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
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id AND g.approval_status = 'Approved'
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
              COALESCE(AVG(g.grade_point), 0) AS cgpa,
              COALESCE(SUM(c.credit_hours), 0) AS total_credit
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.department_id
       LEFT JOIN enrollments e ON e.student_id = s.student_id
       LEFT JOIN sections sec  ON e.section_id = sec.section_id
       LEFT JOIN courses c     ON sec.course_id = c.course_id
       LEFT JOIN grades g      ON g.enrollment_id = e.enrollment_id AND g.approval_status = 'Approved'
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
       WHERE d.is_available_for_selection = TRUE ORDER BY d.department_name, f.field_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// ---------- AVAILABLE DEPARTMENTS FOR STUDENT SELECTION ----------
exports.getAvailableDepartments = async (req, res, next) => {
  try {
    const includeUnavailable = req.query.include_unavailable === '1';
    const [rows] = await db.query(
      `SELECT d.department_id, d.department_name, d.department_code, d.faculty, d.college_id,
              d.capacity, d.min_score, d.is_available_for_selection, c.college_name,
              f.field_id, f.field_name,
              CASE WHEN f.field_id IS NULL THEN 0
                   ELSE d.capacity - (SELECT COUNT(*) FROM field_selections fs WHERE fs.field_id = f.field_id)
              END AS seats_left
       FROM departments d
       LEFT JOIN colleges c ON c.college_id = d.college_id
       LEFT JOIN fields f ON f.department_id = d.department_id
       ${includeUnavailable ? '' : 'WHERE d.is_available_for_selection = TRUE'}
       ORDER BY c.college_name, d.department_name, f.field_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// ---------- CURRENT STUDENT FIELD PRIORITIES ----------
exports.getMyFieldPriorities = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT fs.id, fs.field_id, fs.priority, f.field_name, d.department_id,
              d.department_name, d.department_code, c.college_name
       FROM field_selections fs
       JOIN fields f ON f.field_id = fs.field_id
       LEFT JOIN departments d ON d.department_id = f.department_id
       LEFT JOIN colleges c ON c.college_id = d.college_id
       WHERE fs.student_id = ?
       ORDER BY fs.priority`,
      [req.user.student_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// ---------- FIELD SELECTION WINDOW STATUS ----------
exports.getFieldSelectionStatus = async (req, res, next) => {
  try {
    const [[row]] = await db.query(
      `SELECT field_selection_open AS configured_open, field_selection_start AS start,
              field_selection_end AS end,
              (field_selection_open = TRUE
               AND (field_selection_start IS NULL OR field_selection_start <= NOW())
               AND (field_selection_end IS NULL OR field_selection_end >= NOW())) AS is_open
       FROM system_settings ORDER BY id LIMIT 1`
    );
    res.json({ open: Boolean(row?.is_open), start: row?.start || null, end: row?.end || null });
  } catch (err) { next(err); }
};

// ---------- SAVE FIELD SELECTIONS ----------
exports.selectFields = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const studentId = req.user.student_id;
    const { priorities } = req.body;
    if (!Array.isArray(priorities) || priorities.length === 0 || priorities.length > 5 || priorities.some((item) =>
      !item || !Number.isInteger(Number(item.field_id)) || Number(item.field_id) < 1 ||
      !Number.isInteger(Number(item.priority)) || Number(item.priority) < 1 || Number(item.priority) > 5
    )) return res.status(400).json({ message: 'Submit between one and five valid field priorities' });
    const fieldIds = priorities.map((item) => Number(item.field_id));
    const ranks = priorities.map((item) => Number(item.priority));
    if (new Set(fieldIds).size !== fieldIds.length) return res.status(400).json({ message: 'A department can only be selected once' });
    if (new Set(ranks).size !== ranks.length) return res.status(400).json({ message: 'Priority numbers must be unique from 1 to 5' });

    await conn.beginTransaction();
    const [[settings]] = await conn.query(
      `SELECT field_selection_open,
              field_selection_start IS NULL OR field_selection_start <= NOW() AS selection_started,
              field_selection_end IS NULL OR field_selection_end >= NOW() AS selection_not_ended
       FROM system_settings ORDER BY id LIMIT 1`
    );
    if (!settings || !settings.field_selection_open || !settings.selection_started || !settings.selection_not_ended) {
      await conn.rollback();
      return res.status(403).json({ message: 'Field selection is currently closed' });
    }
    const [[student]] = await conn.query('SELECT university_entrance_result FROM students WHERE student_id = ? FOR UPDATE', [studentId]);
    if (!student) { await conn.rollback(); return res.status(404).json({ message: 'Student record not found' }); }
    const [departments] = await conn.query(
      `SELECT f.field_id, d.department_id, d.department_name, d.capacity, d.min_score
       FROM fields f JOIN departments d ON d.department_id = f.department_id
       WHERE f.field_id IN (?) AND d.is_available_for_selection = TRUE
       ORDER BY d.department_id FOR UPDATE`,
      [fieldIds]
    );
    if (departments.length !== fieldIds.length) { await conn.rollback(); return res.status(400).json({ message: 'One or more selected departments are unavailable' }); }
    if (new Set(departments.map((item) => Number(item.department_id))).size !== departments.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Choose each department only once' });
    }
    const [counts] = await conn.query(
      `SELECT field_id, COUNT(*) AS selection_count,
              SUM(CASE WHEN student_id = ? THEN 1 ELSE 0 END) AS own_count
       FROM field_selections WHERE field_id IN (?) GROUP BY field_id`,
      [studentId, fieldIds]
    );
    const countMap = new Map(counts.map((row) => [Number(row.field_id), row]));
    const score = Number(student.university_entrance_result || 0);
    for (const department of departments) {
      if (score < Number(department.min_score || 0)) {
        await conn.rollback();
        return res.status(400).json({ message: `${department.department_name}: your entrance score is below the minimum cutoff` });
      }
      const count = countMap.get(Number(department.field_id));
      const seatsLeft = Number(department.capacity) - Number(count?.selection_count || 0) + Number(count?.own_count || 0);
      if (seatsLeft <= 0) {
        await conn.rollback();
        return res.status(400).json({ message: `${department.department_name} has no seats left` });
      }
    }
    await conn.query('DELETE FROM field_selections WHERE student_id = ?', [studentId]);
    const values = priorities.flatMap((item) => [studentId, Number(item.field_id), Number(item.priority)]);
    const tuples = priorities.map(() => '(?, ?, ?)').join(', ');
    await conn.query(`INSERT INTO field_selections (student_id, field_id, priority) VALUES ${tuples}`, values);
    await conn.commit();
    res.json({ message: 'Field priorities submitted successfully', priorities: priorities.length });
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
              CASE WHEN sr.field_id = fs.field_id THEN 'Assigned' ELSE 'Not Assigned' END AS status
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
