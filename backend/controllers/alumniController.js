const db = require('../config/db');

const requestTypes = new Set([
  'transcript',
  'degree_verification',
  'recommendation',
  'replacement_id',
]);

exports.getMyRequests = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT request_id, request_type, purpose, status, admin_note,
              requested_at, ready_at, delivered_at
       FROM alumni_requests
       WHERE student_id = ?
       ORDER BY requested_at DESC, request_id DESC`,
      [req.user.student_id]
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
};

exports.submitRequest = async (req, res, next) => {
  try {
    const requestType = req.body?.request_type;
    const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : '';
    if (!requestTypes.has(requestType)) {
      return res.status(400).json({ message: 'Select a valid document type.' });
    }
    if (!purpose || purpose.length > 2000) {
      return res.status(400).json({ message: 'Purpose is required and must be 2000 characters or fewer.' });
    }

    const [result] = await db.query(
      `INSERT INTO alumni_requests (student_id, request_type, purpose)
       VALUES (?, ?, ?)`,
      [req.user.student_id, requestType, purpose]
    );
    return res.status(201).json({
      request_id: result.insertId,
      request_type: requestType,
      purpose,
      status: 'Pending',
      message: 'Request submitted.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const [[profile]] = await db.query(
      `SELECT s.student_id, s.student_number, s.first_name, s.last_name,
              s.status, s.current_year, d.department_name,
              u.email AS university_email,
              c.current_email, c.current_phone, c.current_address,
              c.employer, c.job_title, c.updated_at
       FROM students s
       JOIN users u ON u.user_id = s.user_id
       LEFT JOIN departments d ON d.department_id = s.department_id
       LEFT JOIN alumni_contact c ON c.student_id = s.student_id
       WHERE s.student_id = ?`,
      [req.user.student_id]
    );
    if (!profile) return res.status(404).json({ message: 'Alumni profile not found.' });
    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const fields = ['current_email', 'current_phone', 'current_address', 'employer', 'job_title'];
    const values = fields.map((field) => {
      const value = req.body?.[field];
      return typeof value === 'string' ? value.trim() : '';
    });
    const [email, phone, address, employer, jobTitle] = values;

    if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ message: 'Enter a valid email address (maximum 100 characters).' });
    }
    if (
      phone.length > 15 ||
      address.length > 5000 ||
      employer.length > 150 ||
      jobTitle.length > 150
    ) {
      return res.status(400).json({ message: 'One or more contact fields exceed the allowed length.' });
    }

    await db.query(
      `INSERT INTO alumni_contact
         (student_id, current_email, current_phone, current_address, employer, job_title)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (student_id) DO UPDATE SET
         current_email = EXCLUDED.current_email,
         current_phone = EXCLUDED.current_phone,
         current_address = EXCLUDED.current_address,
         employer = EXCLUDED.employer,
         job_title = EXCLUDED.job_title,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.student_id, ...values.map((value) => value || null)]
    );
    return res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

exports.getMyTranscript = async (req, res, next) => {
  try {
    const [courses] = await db.query(
      `SELECT c.course_code, c.course_title, c.credit_hours,
              sec.academic_year, sec.semester, e.status AS enrollment_status,
              g.total_mark, g.letter_grade, g.grade_point
       FROM enrollments e
       JOIN sections sec ON sec.section_id = e.section_id
       JOIN courses c ON c.course_id = sec.course_id
       LEFT JOIN grades g
         ON g.enrollment_id = e.enrollment_id
        AND g.approval_status = 'Approved'
       WHERE e.student_id = ?
       ORDER BY sec.academic_year, sec.semester, c.course_code`,
      [req.user.student_id]
    );

    let totalCredit = 0;
    let weightedPoints = 0;
    for (const course of courses) {
      const credit = Number(course.credit_hours) || 0;
      const gradePoint = course.grade_point === null ? null : Number(course.grade_point);
      if (gradePoint !== null && Number.isFinite(gradePoint)) {
        totalCredit += credit;
        weightedPoints += gradePoint * credit;
      }
    }

    return res.json({
      courses,
      cgpa: totalCredit ? Number((weightedPoints / totalCredit).toFixed(2)) : 0,
      total_credit: totalCredit,
    });
  } catch (error) {
    return next(error);
  }
};

exports.adminList = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT ar.*, s.student_number, s.first_name, s.last_name, u.email
       FROM alumni_requests ar
       JOIN students s ON s.student_id = ar.student_id
       JOIN users u ON u.user_id = s.user_id
       ORDER BY ar.requested_at DESC`
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
};

exports.adminUpdate = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    const body = req.body || {};
    const { status } = body;
    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ message: 'Invalid request ID.' });
    }
    if (!['Processing', 'Ready', 'Delivered', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Choose a valid request status.' });
    }
    const adminNote = typeof body.admin_note === 'string'
      ? body.admin_note.trim().slice(0, 4000) || null
      : null;
    const [result] = await db.query(
      `UPDATE alumni_requests
       SET status = ?, admin_note = ?,
           ready_at = CASE WHEN ? = 'Ready' THEN COALESCE(ready_at, CURRENT_TIMESTAMP) ELSE ready_at END,
           delivered_at = CASE WHEN ? = 'Delivered' THEN COALESCE(delivered_at, CURRENT_TIMESTAMP) ELSE delivered_at END
       WHERE request_id = ?`,
      [status, adminNote, status, status, requestId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Alumni request not found.' });
    return res.json({ message: 'Alumni request updated.' });
  } catch (error) {
    return next(error);
  }
};

exports.profile = exports.getProfile;
exports.requests = exports.getMyRequests;
exports.createRequest = exports.submitRequest;
exports.transcript = exports.getMyTranscript;
