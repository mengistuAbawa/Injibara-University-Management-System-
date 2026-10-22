const db = require('../config/db');
const { hash } = require('../utils/hashPassword');
const generateTempPassword = require('../utils/generateTempPassword');
const generateUsername = require('../utils/generateUsername');

/* =========================================================
   1. CREATE STUDENT (Register new student)
   ========================================================= */
exports.createStudent = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      student_number, first_name, last_name, grandfather_name,
      gender, date_of_birth, phone_number, region,
      department_id, admission_year, current_year,
      dormitory, campus, building_no, building_name, floor, dorm, bed_no,
      handicapped_case, university_entrance_result, highschool_region,
    } = req.body;

    /* ---- validation ---- */
    if (!student_number || !first_name || !last_name || !grandfather_name) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Missing required: student_number, first_name, last_name, grandfather_name',
      });
    }
    if (!department_id) {
      await conn.rollback();
      return res.status(400).json({ message: 'Department is required' });
    }

    /* ---- duplicate check ---- */
    const [dup] = await conn.query(
      'SELECT student_id FROM students WHERE student_number = ? LIMIT 1',
      [student_number]
    );
    if (dup.length > 0) {
      await conn.rollback();
      return res
        .status(409)
        .json({ message: `Student number ${student_number} already exists` });
    }

    /* ---- auto-generate temp password ---- */
    const tempPassword = generateTempPassword(grandfather_name);
    const hashed = hash(tempPassword);
    const email = `${student_number
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')}@inu.edu.et`;

    /* ---- insert user ---- */
    const [u] = await conn.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, 'student')`,
      [generateUsername(student_number), first_name, last_name, email, hashed]
    );

    /* ---- insert student ---- */
    await conn.query(
      `INSERT INTO students
        (user_id, student_number, first_name, last_name, grandfather_name,
         gender, date_of_birth, phone_number, region,
         department_id, admission_year, current_year,
         dormitory, campus, building_no, building_name, floor, dorm, bed_no,
         handicapped_case, university_entrance_result, highschool_region)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.insertId,
        student_number, first_name, last_name, grandfather_name,
        gender || null, date_of_birth || null, phone_number || null, region || null,
        department_id, admission_year || null, current_year || 1,
        dormitory || null, campus || null, building_no || null,
        building_name || null, floor || null, dorm || null, bed_no || null,
        handicapped_case || null,
        university_entrance_result || null,
        highschool_region || null,
      ]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Student created successfully',
      student_number,
      username: generateUsername(student_number),
      email,
      tempPassword,
      loginHint: 'Username = INU + student number, Password = temporary password',
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* =========================================================
   2. SEARCH STUDENTS
   ========================================================= */
exports.searchStudents = async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await db.query(
      `SELECT s.student_id, s.student_number, s.first_name, s.last_name,
              s.current_year, s.status, d.department_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.department_id
       WHERE s.student_number LIKE ?
          OR s.first_name     LIKE ?
          OR s.last_name      LIKE ?
       ORDER BY s.first_name
       LIMIT 50`,
      [q, q, q]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.listStudentAccounts = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.username, u.email, s.student_number, s.first_name, s.last_name
       FROM users u JOIN students s ON s.user_id = u.user_id
       WHERE u.role = 'student' ORDER BY s.last_name, s.first_name`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.resetStudentPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const [result] = await db.query(
      `UPDATE users SET password_hash = ? WHERE user_id = ? AND role = 'student'`,
      [hash(password), req.params.userId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Student account not found' });
    res.json({ message: 'Student password updated' });
  } catch (err) { next(err); }
};

/* =========================================================
   3. GET ONE STUDENT (full profile)
   ========================================================= */
exports.getStudent = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.email, d.department_name
       FROM students s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN departments d ON s.department_id = d.department_id
       WHERE s.student_id = ?`,
      [req.params.studentId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

/* =========================================================
   4. UPDATE STUDENT
   ========================================================= */
exports.updateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const fields = [
      'first_name', 'last_name', 'grandfather_name',
      'gender', 'date_of_birth', 'phone_number', 'region',
      'department_id', 'admission_year', 'current_year', 'status',
      'dormitory', 'campus', 'building_no', 'building_name',
      'floor', 'dorm', 'bed_no',
      'handicapped_case', 'university_entrance_result', 'highschool_region',
    ];

    const updates = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(studentId);
    await db.query(
      `UPDATE students SET ${updates.join(', ')} WHERE student_id = ?`,
      params
    );
    res.json({ message: 'Student updated' });
  } catch (err) { next(err); }
};

/* =========================================================
   5. LIST ALL SECTIONS  (for enrollment dropdown)
   ========================================================= */
exports.listSections = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sec.section_id, c.course_code, c.course_title, c.credit_hours,
         sec.academic_year, sec.semester, sec.room, sec.schedule,
         CONCAT(i.first_name,' ',i.last_name) AS instructor,
         sec.capacity,
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

exports.listDepartmentOfferings = async (req, res, next) => {
  try {
    const { academic_year, semester, department_id } = req.query;
    const conditions = ['o.is_active=TRUE']; const params = [];
    if (academic_year) { conditions.push('o.academic_year=?'); params.push(academic_year); }
    if (semester) { if (!['I','II','Summer'].includes(semester)) return res.status(400).json({ message: 'Invalid semester.' }); conditions.push('o.semester=?'); params.push(semester); }
    if (department_id) { if (!Number.isInteger(Number(department_id)) || Number(department_id)<1) return res.status(400).json({ message: 'Invalid department.' }); conditions.push('o.department_id=?'); params.push(department_id); }
    const [rows] = await db.query(`SELECT o.offering_id,o.department_id,o.course_id,o.year_level,o.semester,o.academic_year,d.department_name,c.course_code,c.course_title,c.credit_hours
      FROM department_offerings o JOIN departments d ON d.department_id=o.department_id JOIN courses c ON c.course_id=o.course_id
      WHERE ${conditions.join(' AND ')} ORDER BY o.academic_year DESC,o.semester,d.department_name,c.course_code`, params);
    res.json(rows);
  } catch (error) { next(error); }
};

exports.createSection = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { course_id, year_level, academic_year, semester, room, schedule, capacity } = req.body;
    const numericCapacity = capacity === undefined || capacity === '' ? 50 : Number(capacity);
    if (!Number.isInteger(Number(course_id)) || Number(course_id)<1 || !Number.isInteger(Number(year_level)) || Number(year_level)<1 || Number(year_level)>5 || typeof academic_year !== 'string' || !/^\d{4}\/\d{4}$/.test(academic_year) || !['I','II','Summer'].includes(semester) || !Number.isInteger(numericCapacity) || numericCapacity<1 || numericCapacity>1000) return res.status(400).json({ message: 'Enter a course offering, academic year, semester, and capacity from 1 to 1000.' });
    await conn.beginTransaction();
    const [offering] = await conn.query(`SELECT o.department_id,o.year_level FROM department_offerings o
      JOIN courses c ON c.course_id=o.course_id AND c.department_id=o.department_id
      WHERE o.course_id=? AND o.year_level=? AND o.academic_year=? AND o.semester=? AND o.is_active=TRUE LIMIT 1 FOR UPDATE`, [course_id, year_level, academic_year, semester]);
    if (!offering.length) { await conn.rollback(); return res.status(400).json({ message: 'This course has not been assigned to your department by the Dean for this year and semester.' }); }
    const [result] = await conn.query('INSERT INTO sections (course_id,academic_year,semester,room,schedule,capacity) VALUES (?,?,?,?,?,?)', [course_id, academic_year, semester, room?.trim() || null, schedule?.trim() || null, numericCapacity]);
    await conn.commit(); res.status(201).json({ section_id: result.insertId, message: 'Section created.' });
  } catch (error) { await conn.rollback(); next(error); }
  finally { conn.release(); }
};

/* Sections for a newly approved instructor, limited to their department. */
exports.getInstructorAssignableSections = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sec.section_id, sec.academic_year, sec.semester, sec.capacity,
              c.course_code, c.course_title, sec.instructor_id,
              CONCAT(i.first_name, ' ', i.last_name) AS instructor_name
       FROM instructors target
       JOIN courses c ON c.department_id = target.department_id
       JOIN sections sec ON sec.course_id = c.course_id
       LEFT JOIN instructors i ON i.instructor_id = sec.instructor_id
       WHERE target.instructor_id = ? AND (sec.instructor_id IS NULL OR sec.instructor_id = target.instructor_id)
       ORDER BY sec.academic_year DESC, c.course_code, sec.section_id`,
      [req.params.instructorId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.assignInstructorSection = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE sections sec
       JOIN courses c ON c.course_id = sec.course_id
       JOIN instructors i ON i.instructor_id = ? AND i.department_id = c.department_id
       SET sec.instructor_id = ?
       WHERE sec.section_id = ? AND (sec.instructor_id IS NULL OR sec.instructor_id = ?)`,
      [req.params.instructorId, req.params.instructorId, req.params.sectionId, req.params.instructorId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Section or instructor not found in the same department' });
    res.json({ message: 'Instructor assigned to course section' });
  } catch (err) { next(err); }
};

/* List students currently enrolled in a section (registrar view). */
exports.getSectionStudents = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT e.enrollment_id, s.student_id, s.student_number,
              s.first_name, s.last_name, s.gender, e.status,
              g.letter_grade
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id AND g.approval_status = 'Approved'
       WHERE e.section_id = ? AND e.status = 'Enrolled'
       ORDER BY s.last_name, s.first_name, s.student_number`,
      [req.params.sectionId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   6. ENROLL STUDENT INTO SECTION
   ========================================================= */
exports.enrollStudent = async (req, res, next) => {
  try {
    const { student_id, section_id, academic_year } = req.body;

    const [[balance]] = await db.query(
      `SELECT COUNT(*) AS unpaid_count FROM student_invoices i
       JOIN fee_types f ON f.fee_id = i.fee_id
       WHERE i.student_id = ? AND f.is_mandatory = TRUE
         AND i.status IN ('Unpaid','Partial','Overdue')`,
      [student_id]
    );
    if (balance.unpaid_count > 0) return res.status(400).json({ message: 'Student has unpaid fees' });

    /* capacity check */
    const [[{ cap, taken }]] = await db.query(
      `SELECT
         (SELECT capacity FROM sections WHERE section_id = ?) AS cap,
         (SELECT COUNT(*) FROM enrollments
          WHERE section_id = ? AND status='Enrolled') AS taken`,
      [section_id, section_id]
    );

    if (taken >= cap) {
      return res.status(400).json({ message: 'Section is full' });
    }

    await db.query(
      `INSERT INTO enrollments (student_id, section_id, academic_year)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status='Enrolled'`,
      [student_id, section_id, academic_year]
    );

    res.status(201).json({ message: 'Student enrolled successfully' });
  } catch (err) { next(err); }
};

/* =========================================================
   7. UNENROLL / DROP
   ========================================================= */
exports.dropEnrollment = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    await db.query(
      `UPDATE enrollments SET status='Dropped' WHERE enrollment_id = ?`,
      [enrollmentId]
    );
    res.json({ message: 'Enrollment dropped' });
  } catch (err) { next(err); }
};

/* =========================================================
   8. LIST SECTIONS THE STUDENT IS ENROLLED IN
   ========================================================= */
exports.getStudentEnrollments = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT e.enrollment_id, e.academic_year, e.status,
              c.course_code, c.course_title, c.credit_hours,
              sec.semester, sec.room, sec.schedule,
              CONCAT(i.first_name,' ',i.last_name) AS instructor
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.section_id
       JOIN courses c    ON sec.course_id = c.course_id
       LEFT JOIN instructors i ON sec.instructor_id = i.instructor_id
       WHERE e.student_id = ?
       ORDER BY e.academic_year DESC, sec.semester, c.course_code`,
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   9. PUBLISH FIELD PLACEMENT RESULT
   ========================================================= */
exports.publishResult = async (req, res, next) => {
  try {
    const { student_id, field_id, status } = req.body;
    await db.query(
      `INSERT INTO selection_results
        (student_id, field_id, status, announced_on)
       VALUES (?, ?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE
         field_id     = VALUES(field_id),
         status       = VALUES(status),
         announced_on = VALUES(announced_on)`,
      [student_id, field_id, status || 'Assigned']
    );
    res.json({ message: 'Result published' });
  } catch (err) { next(err); }
};

/* =========================================================
   10. BULK PUBLISH  (auto-assign by priority)
   ========================================================= */
exports.bulkPublishResults = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    /* Assign every student their priority-1 field if capacity allows */
    const [students] = await conn.query(
      `SELECT fs.student_id, fs.field_id, fs.priority
       FROM field_selections fs
       WHERE fs.priority = 1
       ORDER BY fs.student_id`
    );

    for (const s of students) {
      await conn.query(
        `INSERT INTO selection_results
          (student_id, field_id, status, announced_on)
         VALUES (?, ?, 'Assigned', CURDATE())
         ON DUPLICATE KEY UPDATE
           field_id     = VALUES(field_id),
           status       = VALUES(status),
           announced_on = VALUES(announced_on)`,
        [s.student_id, s.field_id]
      );
    }

    await conn.commit();
    res.json({ message: `Published ${students.length} results` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/* =========================================================
   11. TRANSCRIPT
   ========================================================= */
exports.getTranscript = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.course_code, c.course_title, c.credit_hours,
              sec.academic_year, sec.semester,
              g.total_mark, g.letter_grade, g.grade_point
       FROM enrollments e
       JOIN sections sec ON e.section_id = sec.section_id
       JOIN courses c    ON sec.course_id = c.course_id
       LEFT JOIN grades g ON g.enrollment_id = e.enrollment_id AND g.approval_status = 'Approved'
       WHERE e.student_id = ?
       ORDER BY sec.academic_year, sec.semester, c.course_code`,
      [req.params.studentId]
    );

    /* Compute CGPA */
    const valid = rows.filter(r => r.grade_point !== null);
    const totalCredit = valid.reduce((a, r) => a + Number(r.credit_hours), 0);
    const weighted    = valid.reduce((a, r) =>
      a + Number(r.credit_hours) * Number(r.grade_point), 0);
    const cgpa = totalCredit === 0
      ? 0
      : Number((weighted / totalCredit).toFixed(2));

    res.json({ courses: rows, cgpa, total_credit: totalCredit });
  } catch (err) { next(err); }
};

/* =========================================================
   12. DASHBOARD STATS
   ========================================================= */
exports.getStats = async (req, res, next) => {
  try {
    const [[{ total_students }]] = await db.query(
      `SELECT COUNT(*) AS total_students FROM students`
    );
    const [[{ active_students }]] = await db.query(
      `SELECT COUNT(*) AS active_students FROM students WHERE status='Active'`
    );
    const [[{ total_sections }]] = await db.query(
      `SELECT COUNT(*) AS total_sections FROM sections`
    );
    const [[{ total_enrollments }]] = await db.query(
      `SELECT COUNT(*) AS total_enrollments FROM enrollments WHERE status='Enrolled'`
    );
    const [[{ pending_results }]] = await db.query(
      `SELECT COUNT(*) AS pending_results
       FROM field_selections fs
       LEFT JOIN selection_results sr ON sr.student_id = fs.student_id
       WHERE sr.result_id IS NULL`
    );

    res.json({
      total_students,
      active_students,
      total_sections,
      total_enrollments,
      pending_results,
    });
  } catch (err) { next(err); }
};
