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

// ---------- COST SHARING ----------
exports.submitCostSharingForm = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const [[profile]] = await db.query(
      `SELECT s.*, d.department_name
       FROM students s
       LEFT JOIN departments d ON d.department_id = s.department_id
       WHERE s.student_id = ?`,
      [studentId]
    );
    if (!profile) return res.status(404).json({ message: 'Student profile not found.' });

    const [[existing]] = await db.query(
      `SELECT form_id FROM cost_sharing_forms
       WHERE student_id = ? AND status IN ('Draft', 'Pending', 'Approved') LIMIT 1`,
      [studentId]
    );
    if (existing) return res.status(409).json({ message: 'A cost-sharing form already exists.' });

    const body = req.body;
    const studentType = profile.department_id ? 'department' : 'fresh';
    const [[form]] = await db.query(
      `INSERT INTO cost_sharing_forms (
        student_id, student_type, full_name, sex, date_of_birth, mother_full_name, region, zone,
        woreda, city_town, phone_number, pobox, highschool_name, highschool_completion_date,
        college_faculty, department, year_of_attendance, current_year, withdrawn_date,
        withdrawn_semester, is_transferred, prev_university_name, prev_department,
        date_of_transfer, demand_in_kind, demand_in_cash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      RETURNING *`,
      [
        studentId, studentType, body.full_name || `${profile.first_name} ${profile.last_name}`,
        body.sex || profile.gender, body.date_of_birth || profile.date_of_birth,
        body.mother_full_name || null, body.region || profile.region || null, body.zone || null,
        body.woreda || null, body.city_town || null, body.phone_number || profile.phone_number || null,
        body.pobox || null, body.highschool_name || null, body.highschool_completion_date || null,
        body.college_faculty || 'Engineering & Technology', body.department || profile.department_name || null,
        body.year_of_attendance || profile.admission_year || null, body.current_year || profile.current_year || null,
        studentType === 'department' ? (body.withdrawn_date || null) : null,
        studentType === 'department' ? (body.withdrawn_semester || null) : null,
        studentType === 'department' ? Boolean(body.is_transferred) : false,
        studentType === 'department' ? (body.prev_university_name || null) : null,
        studentType === 'department' ? (body.prev_department || null) : null,
        studentType === 'department' ? (body.date_of_transfer || null) : null,
        body.demand_in_kind || 'none', body.demand_in_cash || 'none',
      ]
    );
    return res.status(201).json({ form_id: form.form_id, student_type: studentType });
  } catch (err) { return next(err); }
};

exports.getCurrentCostSharingForm = async (req, res, next) => {
  try {
    const [[form]] = await db.query(
      'SELECT * FROM cost_sharing_forms WHERE student_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.student_id]
    );
    return res.json(form || null);
  } catch (err) { return next(err); }
};

exports.signCostSharingAgreement = async (req, res, next) => {
  try {
    const advancePaid = Boolean(req.body.advance_paid);
    const receiptNo = advancePaid ? String(req.body.receipt_no || '').trim() : null;
    if (advancePaid && !receiptNo) {
      return res.status(400).json({ message: 'Receipt number is required for advance payment.' });
    }
    const discount = advancePaid ? 10 : 0;
    const calculatedFee = Number((17695.95 * (1 - discount / 100)).toFixed(2));
    const [[form]] = await db.query(
      `UPDATE cost_sharing_forms
       SET signed_by_student = TRUE, advance_paid = ?, advance_discount = ?,
           receipt_no = ?, calculated_fee = ?, status = CASE WHEN status = 'Draft' THEN 'Pending' ELSE status END
       WHERE form_id = ? AND student_id = ? RETURNING *`,
      [advancePaid, discount, receiptNo, calculatedFee, req.params.formId, req.user.student_id]
    );
    if (!form) return res.status(404).json({ message: 'Cost-sharing form not found.' });
    return res.json({ message: 'Agreement signed and submitted to the registrar.', form });
  } catch (err) { return next(err); }
};
