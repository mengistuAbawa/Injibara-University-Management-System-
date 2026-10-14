const db = require('../config/db');

/* ---------------------------------------------------------
   Helper: get the HOD's department_id from the JWT
   --------------------------------------------------------- */
async function getHodDeptId(instructorId) {
  const [rows] = await db.query(
    'SELECT hod_department_id FROM instructors WHERE instructor_id = ? LIMIT 1',
    [instructorId]
  );
  return rows[0]?.hod_department_id || null;
}

/* =========================================================
   1. DEPARTMENT OVERVIEW (stats + counts)
   ========================================================= */
exports.getOverview = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const [[{ total_students }]] = await db.query(
      'SELECT COUNT(*) AS total_students FROM students WHERE department_id = ?',
      [deptId]
    );
    const [[{ total_instructors }]] = await db.query(
      'SELECT COUNT(*) AS total_instructors FROM instructors WHERE department_id = ?',
      [deptId]
    );
    const [[{ total_courses }]] = await db.query(
      'SELECT COUNT(*) AS total_courses FROM courses WHERE department_id = ?',
      [deptId]
    );
    const [[{ total_sections }]] = await db.query(
      `SELECT COUNT(*) AS total_sections
       FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       WHERE c.department_id = ?`,
      [deptId]
    );

    const [dept] = await db.query(
      'SELECT department_name, department_code, faculty FROM departments WHERE department_id = ?',
      [deptId]
    );

    res.json({
      department: dept[0] || {},
      department_id: deptId,
      total_students,
      total_instructors,
      total_courses,
      total_sections,
    });
  } catch (err) { next(err); }
};

/* =========================================================
   2. LIST INSTRUCTORS IN MY DEPARTMENT
   ========================================================= */
exports.listInstructors = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const [rows] = await db.query(
      `SELECT instructor_id, employee_number, first_name, last_name,
              gender, academic_rank, is_hod, office_location,
              (SELECT COUNT(*) FROM sections sec
               WHERE sec.instructor_id = i.instructor_id) AS section_count
       FROM instructors i
       WHERE department_id = ?
       ORDER BY first_name, last_name`,
      [deptId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   3. LIST COURSES IN MY DEPARTMENT
   ========================================================= */
exports.listCourses = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const [rows] = await db.query(
      `SELECT course_id, course_code, course_title, credit_hours,
              year_level, semester, is_elective, category, department_id,
              (SELECT COUNT(*) FROM sections sec
               WHERE sec.course_id = c.course_id) AS section_count
       FROM courses c
       WHERE department_id = ?
       ORDER BY year_level, semester, course_code`,
      [deptId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createCourse = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });
    const { course_code, course_title, credit_hours, year_level, semester, is_elective, category } = req.body;
    if (!course_code || !course_title || !Number.isInteger(Number(credit_hours)) || Number(credit_hours) < 1 || Number(credit_hours) > 10) {
      return res.status(400).json({ message: 'Enter a course code, title, and credit hours from 1 to 10' });
    }
    await db.query(
      `INSERT INTO courses (course_code, course_title, credit_hours, department_id, year_level, semester, is_elective, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_code.trim(), course_title.trim(), Number(credit_hours), deptId, Number(year_level) || 1, semester || 'I', is_elective ? 1 : 0, category || 'Major Course']
    );
    res.status(201).json({ message: 'Course created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Course code already exists' });
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });
    const { course_code, course_title, credit_hours, year_level, semester, is_elective, category } = req.body;
    const [result] = await db.query(
      `UPDATE courses SET course_code = ?, course_title = ?, credit_hours = ?, year_level = ?, semester = ?, is_elective = ?, category = ?
       WHERE course_id = ? AND department_id = ?`,
      [course_code.trim(), course_title.trim(), Number(credit_hours), Number(year_level), semester, is_elective ? 1 : 0, category || 'Major Course', req.params.courseId, deptId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Course not found in your department' });
    res.json({ message: 'Course updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Course code already exists' });
    next(err);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });
    const { academic_year, semester, room, schedule, capacity } = req.body;
    const capacityValue = Number(capacity);
    if (!academic_year || !['I', 'II', 'Summer'].includes(semester) || !Number.isInteger(capacityValue) || capacityValue < 1) {
      return res.status(400).json({ message: 'Enter a valid academic year, semester, and positive capacity' });
    }
    const [result] = await db.query(
      `UPDATE sections sec JOIN courses c ON c.course_id = sec.course_id
       SET sec.academic_year = ?, sec.semester = ?, sec.room = ?, sec.schedule = ?, sec.capacity = ?
       WHERE sec.section_id = ? AND c.department_id = ?`,
      [academic_year.trim(), semester, room || null, schedule || null, capacityValue, req.params.sectionId, deptId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Section not found in your department' });
    res.json({ message: 'Section updated' });
  } catch (err) { next(err); }
};

/* =========================================================
   4. LIST SECTIONS IN MY DEPARTMENT (with instructor)
   ========================================================= */
exports.listSections = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const [rows] = await db.query(
      `SELECT sec.section_id, sec.academic_year, sec.semester,
              sec.room, sec.schedule, sec.capacity,
              c.course_code, c.course_title,
              i.instructor_id,
              CONCAT(i.first_name,' ',i.last_name) AS instructor_name,
              (SELECT COUNT(*) FROM enrollments e
               WHERE e.section_id = sec.section_id AND e.status='Enrolled') AS enrolled
       FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       LEFT JOIN instructors i ON sec.instructor_id = i.instructor_id
       WHERE c.department_id = ?
       ORDER BY sec.academic_year DESC, c.course_code`,
      [deptId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   5. ASSIGN INSTRUCTOR TO A SECTION
   ========================================================= */
exports.assignInstructor = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const { section_id, instructor_id } = req.body;
    if (!section_id || !instructor_id) {
      return res.status(400).json({ message: 'section_id and instructor_id required' });
    }

    /* verify the section belongs to my department */
    const [own] = await db.query(
      `SELECT 1 FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       WHERE sec.section_id = ? AND c.department_id = ?
       LIMIT 1`,
      [section_id, deptId]
    );
    if (!own.length) {
      return res.status(403).json({ message: 'Section is not in your department' });
    }

    /* verify the instructor belongs to my department */
    const [ok] = await db.query(
      'SELECT 1 FROM instructors WHERE instructor_id = ? AND department_id = ? LIMIT 1',
      [instructor_id, deptId]
    );
    if (!ok.length) {
      return res.status(403).json({ message: 'Instructor is not in your department' });
    }

    await db.query(
      'UPDATE sections SET instructor_id = ? WHERE section_id = ?',
      [instructor_id, section_id]
    );

    res.json({ message: 'Instructor assigned' });
  } catch (err) { next(err); }
};

/* =========================================================
   6. UNASSIGN INSTRUCTOR
   ========================================================= */
exports.unassignInstructor = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const { sectionId } = req.params;

    /* verify ownership */
    const [own] = await db.query(
      `SELECT 1 FROM sections sec
       JOIN courses c ON sec.course_id = c.course_id
       WHERE sec.section_id = ? AND c.department_id = ?
       LIMIT 1`,
      [sectionId, deptId]
    );
    if (!own.length) {
      return res.status(403).json({ message: 'Section is not in your department' });
    }

    await db.query(
      'UPDATE sections SET instructor_id = NULL WHERE section_id = ?',
      [sectionId]
    );
    res.json({ message: 'Instructor unassigned' });
  } catch (err) { next(err); }
};

/* =========================================================
   7. COURSE PERFORMANCE IN MY DEPARTMENT
   ========================================================= */
exports.getPerformance = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const [rows] = await db.query(
      `SELECT c.course_id, c.course_code, c.course_title, c.credit_hours,
              COUNT(DISTINCT sec.section_id) AS sections,
              COUNT(e.enrollment_id)          AS students,
              ROUND(AVG(g.total_mark), 2)     AS avg_mark,
              SUM(CASE WHEN g.letter_grade IN ('A','A-','B+','B','C+','C','D')
                       THEN 1 ELSE 0 END) AS passed,
              SUM(CASE WHEN g.letter_grade = 'F' THEN 1 ELSE 0 END) AS failed
       FROM courses c
       LEFT JOIN sections sec  ON c.course_id = sec.course_id
       LEFT JOIN enrollments e ON sec.section_id = e.section_id
       LEFT JOIN grades g      ON g.enrollment_id = e.enrollment_id
       WHERE c.department_id = ?
       GROUP BY c.course_id
       ORDER BY c.course_code`,
      [deptId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   8. GRADE DISTRIBUTION ACROSS DEPARTMENT
   ========================================================= */
exports.getGradeDistribution = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const [rows] = await db.query(
      `SELECT g.letter_grade, COUNT(*) AS count
       FROM grades g
       JOIN enrollments e ON g.enrollment_id = e.enrollment_id
       JOIN sections sec  ON e.section_id = sec.section_id
       JOIN courses c     ON sec.course_id = c.course_id
       WHERE c.department_id = ?
       GROUP BY g.letter_grade
       ORDER BY FIELD(g.letter_grade,'A','A-','B+','B','C+','C','D','F')`,
      [deptId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   9. DEPARTMENT STUDENTS (filtered)
   ========================================================= */
exports.listStudents = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const { year, status } = req.query;
    const conditions = ['s.department_id = ?'];
    const params = [deptId];

    if (year)   { conditions.push('s.current_year = ?'); params.push(year); }
    if (status) { conditions.push('s.status = ?');       params.push(status); }

    const [rows] = await db.query(
      `SELECT s.student_id, s.student_number, s.first_name, s.last_name,
              s.gender, s.current_year, s.status, s.region,
              (SELECT cgpa FROM v_student_cgpa WHERE student_id = s.student_id) AS cgpa
       FROM students s
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.current_year DESC, s.first_name`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
};

/* =========================================================
   10. APPROVE COURSE (toggle is_active — optional)
   ========================================================= */
exports.approveCourse = async (req, res, next) => {
  try {
    const deptId = await getHodDeptId(req.user.instructor_id);
    if (!deptId) return res.status(403).json({ message: 'Not a HOD' });

    const { courseId } = req.params;

    const [own] = await db.query(
      'SELECT 1 FROM courses WHERE course_id = ? AND department_id = ? LIMIT 1',
      [courseId, deptId]
    );
    if (!own.length) {
      return res.status(403).json({ message: 'Course not in your department' });
    }

    /* This example assumes a courses.is_approved column exists.
       If not, add it first:
       ALTER TABLE courses ADD COLUMN is_approved BOOLEAN DEFAULT TRUE; */
    await db.query(
      'UPDATE courses SET is_approved = NOT is_approved WHERE course_id = ?',
      [courseId]
    );
    res.json({ message: 'Course approval toggled' });
  } catch (err) { next(err); }
};
