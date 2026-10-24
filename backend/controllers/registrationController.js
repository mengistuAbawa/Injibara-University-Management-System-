const db = require('../config/db');

const makeError = (message, status = 400) => Object.assign(new Error(message), { status });

exports.listSections = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT sec.section_id, sec.academic_year, sec.semester, sec.room,
              sec.schedule, sec.capacity, c.course_code, c.course_title,
              c.credit_hours,
              CONCAT_WS(' ', i.first_name, i.last_name) AS instructor,
              (SELECT COUNT(*) FROM enrollments e
               WHERE e.section_id = sec.section_id AND e.status = 'Enrolled') AS enrolled
       FROM sections sec
       JOIN courses c ON c.course_id = sec.course_id
       LEFT JOIN instructors i ON i.instructor_id = sec.instructor_id
       ORDER BY sec.academic_year DESC, sec.semester, c.course_code`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getMyRequest = async (req, res, next) => {
  try {
    const [requests] = await db.query(
      `SELECT request_id, academic_year, status, student_note, registrar_note,
              submitted_at, reviewed_at
       FROM student_registration_requests
       WHERE student_id = ?
       ORDER BY submitted_at DESC, request_id DESC LIMIT 1`,
      [req.user.student_id]
    );
    if (!requests.length) return res.json(null);
    const request = requests[0];
    const [sections] = await db.query(
      `SELECT sec.section_id, sec.academic_year, sec.semester, sec.room,
              sec.schedule, c.course_code, c.course_title, c.credit_hours
       FROM student_registration_request_sections rs
       JOIN sections sec ON sec.section_id = rs.section_id
       JOIN courses c ON c.course_id = sec.course_id
       WHERE rs.request_id = ? ORDER BY c.course_code`,
      [request.request_id]
    );
    res.json({ ...request, sections });
  } catch (err) { next(err); }
};

exports.submitRequest = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const studentId = req.user.student_id;
    const academicYear = String(req.body.academic_year || '').trim();
    const studentNote = String(req.body.student_note || '').trim();
    const sectionIds = req.body.section_ids;
    if (!studentId) throw makeError('Student account is not linked to a student profile', 403);
    if (!/^\d{4}\/\d{4}$/.test(academicYear)) throw makeError('Enter an academic year in YYYY/YYYY format');
    if (!Array.isArray(sectionIds) || sectionIds.length === 0 || sectionIds.length > 12) {
      throw makeError('Choose between 1 and 12 course sections');
    }
    const ids = sectionIds.map(Number);
    if (ids.some(id => !Number.isInteger(id) || id < 1) || new Set(ids).size !== ids.length) {
      throw makeError('The selected course sections are invalid');
    }

    await conn.beginTransaction();
    const [student] = await conn.query(
      'SELECT student_id FROM students WHERE student_id = ? FOR UPDATE', [studentId]
    );
    if (!student.length) throw makeError('Student profile not found', 404);
    const [pending] = await conn.query(
      `SELECT request_id FROM student_registration_requests
       WHERE student_id = ? AND academic_year = ? AND status = 'Pending' LIMIT 1`,
      [studentId, academicYear]
    );
    if (pending.length) throw makeError('You already have a request awaiting review for this academic year', 409);

    const [sections] = await conn.query(
      'SELECT section_id FROM sections WHERE section_id IN (?) AND academic_year = ?',
      [ids, academicYear]
    );
    if (sections.length !== ids.length) throw makeError('One or more sections do not belong to the selected academic year');

    const [created] = await conn.query(
      `INSERT INTO student_registration_requests (student_id, academic_year, student_note)
       VALUES (?, ?, ?)`,
      [studentId, academicYear, studentNote || null]
    );
    for (const sectionId of ids) {
      await conn.query(
        `INSERT INTO student_registration_request_sections (request_id, section_id)
         VALUES (?, ?)`,
        [created.insertId, sectionId]
      );
    }
    await conn.commit();
    res.status(201).json({ message: 'Registration request submitted for registrar review', request_id: created.insertId });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally { conn.release(); }
};

exports.listRequests = async (req, res, next) => {
  try {
    const status = req.query.status;
    const allowed = ['Pending', 'Approved', 'Rejected'];
    if (status && !allowed.includes(status)) throw makeError('Invalid request status');
    const statusClause = status ? 'WHERE r.status = ?' : '';
    const params = status ? [status] : [];
    const [rows] = await db.query(
      `SELECT r.request_id, r.academic_year, r.status, r.student_note,
              r.registrar_note, r.submitted_at, r.reviewed_at,
              s.student_id, s.student_number, s.first_name, s.last_name,
              (SELECT COUNT(*) FROM student_registration_request_sections rs
               WHERE rs.request_id = r.request_id) AS section_count
       FROM student_registration_requests r
       JOIN students s ON s.student_id = r.student_id
       ${statusClause}
       ORDER BY FIELD(r.status, 'Pending', 'Approved', 'Rejected'), r.submitted_at ASC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getRequest = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT r.request_id, r.academic_year, r.status, r.student_note,
              r.registrar_note, r.submitted_at, r.reviewed_at,
              s.student_id, s.student_number, s.first_name, s.last_name,
              s.gender, s.phone_number, s.region, s.department_id,
              d.department_name
       FROM student_registration_requests r
       JOIN students s ON s.student_id = r.student_id
       LEFT JOIN departments d ON d.department_id = s.department_id
       WHERE r.request_id = ?`,
      [req.params.requestId]
    );
    if (!rows.length) throw makeError('Registration request not found', 404);
    const [sections] = await db.query(
      `SELECT sec.section_id, sec.academic_year, sec.semester, sec.room,
              sec.schedule, sec.capacity, c.course_code, c.course_title,
              c.credit_hours,
              (SELECT COUNT(*) FROM enrollments e
               WHERE e.section_id = sec.section_id AND e.status = 'Enrolled') AS enrolled
       FROM student_registration_request_sections rs
       JOIN sections sec ON sec.section_id = rs.section_id
       JOIN courses c ON c.course_id = sec.course_id
       WHERE rs.request_id = ? ORDER BY c.course_code`,
      [req.params.requestId]
    );
    res.json({ ...rows[0], sections });
  } catch (err) { next(err); }
};

exports.reviewRequest = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const requestId = Number(req.params.requestId);
    const decision = req.body.decision;
    const note = String(req.body.registrar_note || '').trim();
    if (!Number.isInteger(requestId) || requestId < 1) throw makeError('Invalid request ID');
    if (!['Approved', 'Rejected'].includes(decision)) throw makeError('Decision must be Approved or Rejected');

    await conn.beginTransaction();
    const [requests] = await conn.query(
      `SELECT request_id, student_id, academic_year, status
       FROM student_registration_requests WHERE request_id = ? FOR UPDATE`,
      [requestId]
    );
    if (!requests.length) throw makeError('Registration request not found', 404);
    const request = requests[0];
    if (request.status !== 'Pending') throw makeError('This request has already been reviewed', 409);

    if (decision === 'Approved') {
      const [items] = await conn.query(
        `SELECT section_id FROM student_registration_request_sections
         WHERE request_id = ? ORDER BY section_id`, [requestId]
      );
      if (!items.length) throw makeError('This request has no selected course sections');

      for (const { section_id: sectionId } of items) {
        const [sections] = await conn.query(
          'SELECT capacity FROM sections WHERE section_id = ? FOR UPDATE', [sectionId]
        );
        if (!sections.length) throw makeError('A selected section no longer exists', 409);
        const [[{ enrolled }]] = await conn.query(
          `SELECT COUNT(*) AS enrolled FROM enrollments
           WHERE section_id = ? AND status = 'Enrolled'`, [sectionId]
        );
        if (enrolled >= sections[0].capacity) throw makeError('A selected section is full; the request was not approved', 409);
        const [existing] = await conn.query(
          `SELECT enrollment_id FROM enrollments
           WHERE student_id = ? AND section_id = ? AND academic_year = ? AND status = 'Enrolled'`,
          [request.student_id, sectionId, request.academic_year]
        );
        if (!existing.length) {
          await conn.query(
            `INSERT INTO enrollments (student_id, section_id, academic_year)
             VALUES (?, ?, ?)
             ON CONFLICT (student_id, section_id, academic_year) DO UPDATE SET status = 'Enrolled'`,
            [request.student_id, sectionId, request.academic_year]
          );
        }
      }
    }

    await conn.query(
      `UPDATE student_registration_requests
       SET status = ?, registrar_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE request_id = ?`,
      [decision, note || null, req.user.id, requestId]
    );
    await conn.commit();
    res.json({ message: `Registration request ${decision.toLowerCase()}` });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    next(err);
  } finally { conn.release(); }
};
