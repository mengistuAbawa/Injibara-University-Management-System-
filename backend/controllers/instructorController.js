const db = require('../config/db');
const { getLetterAndPoint } = require('../utils/calculateGPA');

/* =========================================================
   1. GET MY SECTIONS (all sections this instructor teaches)
   ========================================================= */
exports.getMySections = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sec.section_id, c.course_code, c.course_title, c.credit_hours,
         sec.academic_year, sec.semester, sec.room, sec.schedule,
         sec.capacity,
         a.status AS upload_status,a.dean_note,
         (SELECT COUNT(*) FROM enrollments e
          WHERE e.section_id = sec.section_id AND e.status='Enrolled') AS enrolled
       FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       LEFT JOIN grade_upload_approvals a ON a.section_id=sec.section_id
       WHERE sec.instructor_id = ?
       ORDER BY sec.academic_year DESC, sec.semester, c.course_code`,
      [req.user.instructor_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   2. GET SECTION DETAIL (single section metadata)
   ========================================================= */
exports.getSection = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sec.section_id, c.course_code, c.course_title, c.credit_hours,
         sec.academic_year, sec.semester, sec.room, sec.schedule,
         sec.capacity,
         a.status AS upload_status,a.dean_note,
         (SELECT COUNT(*) FROM enrollments e
          WHERE e.section_id = sec.section_id AND e.status='Enrolled') AS enrolled
       FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       LEFT JOIN grade_upload_approvals a ON a.section_id=sec.section_id
       WHERE sec.section_id = ? AND sec.instructor_id = ?`,
      [req.params.sectionId, req.user.instructor_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Section not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

/* =========================================================
   3. GET STUDENTS IN A SECTION (with their grades if any)
   ========================================================= */
exports.getSectionStudents = async (req, res, next) => {
  try {
    /* verify this instructor owns the section */
    const [own] = await db.query(
      `SELECT 1 FROM sections
       WHERE section_id = ? AND instructor_id = ? LIMIT 1`,
      [req.params.sectionId, req.user.instructor_id]
    );
    if (!own.length) {
      return res.status(403).json({ message: 'Not your section' });
    }

    const [rows] = await db.query(
      `SELECT
         e.enrollment_id, e.status,
         s.student_id, s.student_number, s.first_name, s.last_name, s.gender,
         g.assignment_mark, g.midterm_mark, g.final_mark,
         g.total_mark, g.letter_grade, g.grade_point
       FROM enrollments e
       JOIN students s ON e.student_id = s.student_id
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id
       WHERE e.section_id = ? AND e.status = 'Enrolled'
       ORDER BY s.first_name, s.last_name`,
      [req.params.sectionId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   4. BULK ENTER / UPDATE GRADES
   ========================================================= */
exports.bulkEnterGrades = async (req, res, next) => {
  if (req.user.is_dean) return res.status(403).json({ message: 'Deans cannot enter grades.' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { section_id, grades } = req.body;
    /* grades = [{ enrollment_id, assignment, midterm, final }, ...] */

    if (!Array.isArray(grades) || grades.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'No grades provided' });
    }

    /* verify ownership */
    const [own] = await conn.query(
      `SELECT sec.section_id FROM sections sec
       WHERE sec.section_id = ? AND sec.instructor_id = ? LIMIT 1`,
      [section_id, req.user.instructor_id]
    );
    if (!own.length) {
      await conn.rollback();
      return res.status(403).json({ message: 'Not your section' });
    }
    const [[finalized]] = await conn.query("SELECT COUNT(*) AS count FROM grades g JOIN enrollments e ON e.enrollment_id=g.enrollment_id WHERE e.section_id=? AND g.finalized=TRUE", [section_id]);
    if (finalized.count) { await conn.rollback(); return res.status(409).json({ message: 'Grades approved by the Dean are finalized and read-only.' }); }

    /* upsert each row */
    for (const g of grades) {
      const assign  = Number(g.assignment) || 0;
      const midterm = Number(g.midterm)    || 0;
      const final   = Number(g.final)      || 0;
      if (assign < 0 || assign > 30 || midterm < 0 || midterm > 20 || final < 0 || final > 50) {
        await conn.rollback();
        return res.status(400).json({ message: 'Assignment must be 0–30, midterm 0–20, and final 0–50.' });
      }
      const [enrollment] = await conn.query(
        `SELECT 1 FROM enrollments WHERE enrollment_id = ? AND section_id = ? AND status = 'Enrolled'`,
        [g.enrollment_id, section_id]
      );
      if (!enrollment.length) {
        await conn.rollback();
        return res.status(400).json({ message: 'A student enrollment does not belong to this section.' });
      }
      const total   = assign + midterm + final;
      const { letter, point } = getLetterAndPoint(total);

      await conn.query(
        `INSERT INTO grades
           (enrollment_id, assignment_mark, midterm_mark, final_mark,
            total_mark, letter_grade, grade_point, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
         ON DUPLICATE KEY UPDATE
           assignment_mark = VALUES(assignment_mark),
           midterm_mark    = VALUES(midterm_mark),
           final_mark      = VALUES(final_mark),
           total_mark      = VALUES(total_mark),
           letter_grade    = VALUES(letter_grade),
           grade_point     = VALUES(grade_point),
           approval_status = 'Pending'`,
        [g.enrollment_id, assign, midterm, final, total, letter, point]
      );
    }

    await conn.query(
      `INSERT INTO grade_upload_approvals (section_id,instructor_id,college_id,status,submitted_at)
       SELECT sec.section_id,sec.instructor_id,d.college_id,'Pending',NOW()
       FROM sections sec JOIN courses c ON c.course_id=sec.course_id JOIN departments d ON d.department_id=c.department_id
       WHERE sec.section_id=? AND sec.instructor_id=? AND d.college_id IS NOT NULL
       ON DUPLICATE KEY UPDATE instructor_id=VALUES(instructor_id),college_id=VALUES(college_id),status='Pending',dean_note=NULL,submitted_at=NOW(),reviewed_by=NULL,reviewed_at=NULL`,
      [section_id, req.user.instructor_id]
    );

    await conn.commit();
    res.json({ message: 'Grades saved', count: grades.length });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* =========================================================
   5. SINGLE GRADE UPSERT (rarely used, but useful for fixes)
   ========================================================= */
exports.updateGrade = async (req, res, next) => {
  if (req.user.is_dean) return res.status(403).json({ message: 'Deans cannot enter grades.' });
  const conn = await db.getConnection();
  try {
    const { enrollment_id, assignment, midterm, final } = req.body;

    const marks = [Number(assignment), Number(midterm), Number(final)];
    if (marks.some((mark) => !Number.isFinite(mark)) || marks[0] < 0 || marks[0] > 30 || marks[1] < 0 || marks[1] > 20 || marks[2] < 0 || marks[2] > 50) {
      return res.status(400).json({ message: 'Assignment must be 0–30, midterm 0–20, and final 0–50.' });
    }

    const total = Number(assignment) + Number(midterm) + Number(final);
    const { letter, point } = getLetterAndPoint(total);

    await conn.beginTransaction();
    const [[owned]] = await conn.query('SELECT e.section_id FROM enrollments e JOIN sections sec ON sec.section_id=e.section_id WHERE e.enrollment_id=? AND sec.instructor_id=? FOR UPDATE', [enrollment_id, req.user.instructor_id]);
    if (!owned) { await conn.rollback(); return res.status(403).json({ message: 'Enrollment is not in your section.' }); }
    const [[locked]] = await conn.query('SELECT finalized FROM grades WHERE enrollment_id=? FOR UPDATE', [enrollment_id]);
    if (locked?.finalized) { await conn.rollback(); return res.status(409).json({ message: 'Grades approved by the Dean are finalized and read-only.' }); }

    await conn.query(
      `INSERT INTO grades
         (enrollment_id, assignment_mark, midterm_mark, final_mark,
          total_mark, letter_grade, grade_point, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
       ON DUPLICATE KEY UPDATE
         assignment_mark = VALUES(assignment_mark),
         midterm_mark    = VALUES(midterm_mark),
         final_mark      = VALUES(final_mark),
         total_mark      = VALUES(total_mark),
         letter_grade    = VALUES(letter_grade),
         grade_point     = VALUES(grade_point),
         approval_status = 'Pending'`,
      [enrollment_id, assignment, midterm, final, total, letter, point]
    );

    await conn.query(
      `INSERT INTO grade_upload_approvals (section_id,instructor_id,college_id,status,submitted_at)
       SELECT sec.section_id,sec.instructor_id,d.college_id,'Pending',NOW() FROM sections sec
       JOIN courses c ON c.course_id=sec.course_id JOIN departments d ON d.department_id=c.department_id
       WHERE sec.section_id=? AND d.college_id IS NOT NULL
       ON DUPLICATE KEY UPDATE status='Pending',dean_note=NULL,submitted_at=NOW(),reviewed_by=NULL,reviewed_at=NULL`,
      [owned.section_id]
    );

    await conn.commit();
    res.json({ message: 'Grade updated', total, letter, point });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

/* =========================================================
   6. TAKE / SAVE ATTENDANCE FOR A DATE
   ========================================================= */
exports.saveAttendance = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { section_id, date, records } = req.body;
    /* records = [{ enrollment_id, status }, ...] */

    if (!section_id || !date || !Array.isArray(records)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Missing section_id, date, or records' });
    }

    /* verify ownership */
    const [own] = await conn.query(
      `SELECT 1 FROM sections
       WHERE section_id = ? AND instructor_id = ? LIMIT 1`,
      [section_id, req.user.instructor_id]
    );
    if (!own.length) {
      await conn.rollback();
      return res.status(403).json({ message: 'Not your section' });
    }

    /* delete prior records for that section + date */
    await conn.query(
      `DELETE a FROM attendance a
       JOIN enrollments e ON a.enrollment_id = e.enrollment_id
       WHERE e.section_id = ? AND a.attendance_date = ?`,
      [section_id, date]
    );

    /* insert new */
    for (const r of records) {
      await conn.query(
        `INSERT INTO attendance (enrollment_id, attendance_date, status)
         VALUES (?, ?, ?)`,
        [r.enrollment_id, date, r.status]
      );
    }

    await conn.commit();
    res.json({ message: 'Attendance saved', count: records.length });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* =========================================================
   7. GET ATTENDANCE FOR A SECTION ON A DATE
   ========================================================= */
exports.getAttendance = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { date } = req.query;

    const [rows] = await db.query(
      `SELECT a.enrollment_id, a.attendance_date, a.status
       FROM attendance a
       JOIN enrollments e ON a.enrollment_id = e.enrollment_id
       WHERE e.section_id = ? AND a.attendance_date = ?`,
      [sectionId, date]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   8. DASHBOARD STATS
   ========================================================= */
exports.getStats = async (req, res, next) => {
  try {
    const [[{ total_sections }]] = await db.query(
      `SELECT COUNT(*) AS total_sections
       FROM sections WHERE instructor_id = ?`,
      [req.user.instructor_id]
    );

    const [[{ total_students }]] = await db.query(
      `SELECT COUNT(DISTINCT e.student_id) AS total_students
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.section_id
       WHERE sec.instructor_id = ? AND e.status='Enrolled'`,
      [req.user.instructor_id]
    );

    const [[{ graded_count }]] = await db.query(
      `SELECT COUNT(*) AS graded_count
       FROM grades g
       JOIN enrollments e ON g.enrollment_id = e.enrollment_id
       JOIN sections sec ON e.section_id = sec.section_id
       WHERE sec.instructor_id = ?`,
      [req.user.instructor_id]
    );

    const [[{ pending_grades }]] = await db.query(
      `SELECT COUNT(*) AS pending_grades
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.section_id
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id
       WHERE sec.instructor_id = ? AND e.status='Enrolled' AND g.grade_id IS NULL`,
      [req.user.instructor_id]
    );

    res.json({
      total_sections,
      total_students,
      graded_count,
      pending_grades,
    });
  } catch (err) { next(err); }
};

/* =========================================================
   9. CLASS PERFORMANCE STATS (for one section)
   ========================================================= */
exports.getSectionPerformance = async (req, res, next) => {
  try {
    const { sectionId } = req.params;

    const [[stats]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         ROUND(AVG(g.total_mark), 2) AS avg_mark,
         MIN(g.total_mark) AS min_mark,
         MAX(g.total_mark) AS max_mark,
         SUM(CASE WHEN g.letter_grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D')
                  THEN 1 ELSE 0 END) AS passed,
         SUM(CASE WHEN g.letter_grade = 'F' THEN 1 ELSE 0 END) AS failed
       FROM enrollments e
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id
       WHERE e.section_id = ? AND e.status='Enrolled'`,
      [sectionId]
    );

    const [distribution] = await db.query(
      `SELECT g.letter_grade, COUNT(*) AS count
       FROM grades g
       JOIN enrollments e ON g.enrollment_id = e.enrollment_id
       WHERE e.section_id = ?
       GROUP BY g.letter_grade
       ORDER BY FIELD(g.letter_grade,
         'A+','A','A-','B+','B','B-','C+','C','C-','D','F')`,
      [sectionId]
    );

    res.json({ stats, distribution });
  } catch (err) { next(err); }
};
