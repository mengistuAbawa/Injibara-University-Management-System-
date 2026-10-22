/** Alumni profile, document request, transcript, and administrator request workflows. */
const db = require('../config/db');

exports.profile = async (req, res, next) => {
  try {
    const [[row]] = await db.query(`SELECT s.student_id, s.student_number, s.first_name, s.last_name, s.grandfather_name,
      s.status, s.admission_year, d.department_name, u.email AS university_email,
      c.current_email, c.current_phone, c.current_address, c.employer, c.job_title, c.updated_at
      FROM students s JOIN users u ON u.user_id=s.user_id LEFT JOIN departments d ON d.department_id=s.department_id
      LEFT JOIN alumni_contact c ON c.student_id=s.student_id WHERE s.student_id=?`, [req.user.student_id]);
    res.json(row);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { current_email, current_phone, current_address, employer, job_title } = req.body;
    if (current_email && (String(current_email).length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current_email))) return res.status(400).json({ message: 'Enter a valid email address' });
    if (String(current_phone || '').length > 15 || String(current_address || '').length > 5000 ||
      String(employer || '').length > 150 || String(job_title || '').length > 150) return res.status(400).json({ message: 'Contact fields are too long' });
    await db.query(`INSERT INTO alumni_contact (student_id,current_email,current_phone,current_address,employer,job_title)
      VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE current_email=VALUES(current_email),current_phone=VALUES(current_phone),
      current_address=VALUES(current_address),employer=VALUES(employer),job_title=VALUES(job_title)`,
    [req.user.student_id, current_email || null, current_phone || null, current_address || null, employer || null, job_title || null]);
    res.json({ message: 'Profile updated' });
  } catch (err) { next(err); }
};

exports.requests = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT request_id,request_type,purpose,status,admin_note,requested_at,ready_at,delivered_at FROM alumni_requests WHERE student_id=? ORDER BY requested_at DESC', [req.user.student_id]);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createRequest = async (req, res, next) => {
  try {
    const types = ['transcript', 'degree_verification', 'recommendation', 'replacement_id'];
    const purpose = String(req.body.purpose || '').trim();
    if (!types.includes(req.body.request_type) || !purpose || purpose.length > 2000) return res.status(400).json({ message: 'Select a document type and enter a purpose (up to 2000 characters)' });
    const [result] = await db.query('INSERT INTO alumni_requests (student_id,request_type,purpose) VALUES (?,?,?)', [req.user.student_id, req.body.request_type, purpose]);
    res.status(201).json({ request_id: result.insertId, message: 'Request submitted' });
  } catch (err) { next(err); }
};

exports.transcript = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT s.student_number,s.first_name,s.last_name,d.department_name,
      c.course_code,c.course_title,e.academic_year,sec.semester,g.total_mark,g.letter_grade,g.grade_point
      FROM students s LEFT JOIN departments d ON d.department_id=s.department_id
      LEFT JOIN enrollments e ON e.student_id=s.student_id AND e.status='Completed'
      LEFT JOIN sections sec ON sec.section_id=e.section_id LEFT JOIN courses c ON c.course_id=sec.course_id
      LEFT JOIN grades g ON g.enrollment_id=e.enrollment_id AND g.approval_status='Approved' WHERE s.student_id=? ORDER BY e.academic_year,sec.semester,c.course_code`, [req.user.student_id]);
    if (req.query.download === 'pdf') {
      const clean = (value) => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');
      const first = rows[0] || {};
      const lines = [
        'INJIBARA UNIVERSITY - ACADEMIC TRANSCRIPT',
        `Student: ${first.first_name || ''} ${first.last_name || ''}    ID: ${first.student_number || ''}`,
        `Department: ${first.department_name || ''}`,
        'Year       Sem   Course       Title                         Mark  Grade  Points',
        ...rows.filter((r) => r.course_code).map((r) => `${r.academic_year || ''}  ${r.semester || ''}     ${r.course_code || ''}   ${r.course_title || ''}    ${r.total_mark ?? ''}  ${r.letter_grade || ''}  ${r.grade_point ?? ''}`),
      ].slice(0, 48);
      const stream = `BT\n/F1 9 Tf\n40 800 Td\n${lines.map((line, i) => `${i ? '0 -15 Td\n' : ''}(${clean(line).slice(0, 110)}) Tj`).join('\n')}\nET`;
      const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
      ];
      let pdf = '%PDF-1.4\n'; const offsets = [0];
      objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'ascii')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
      const xref = Buffer.byteLength(pdf, 'ascii');
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="inu-transcript.pdf"');
      return res.send(Buffer.from(pdf, 'ascii'));
    }
    res.json(rows);
  } catch (err) { next(err); }
};

exports.adminList = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT ar.*,s.student_number,s.first_name,s.last_name,u.email
      FROM alumni_requests ar JOIN students s ON s.student_id=ar.student_id JOIN users u ON u.user_id=s.user_id
      ORDER BY ar.requested_at DESC`);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.adminUpdate = async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!Number.isInteger(Number(req.params.id)) || Number(req.params.id) < 1) return res.status(400).json({ message: 'Invalid request id' });
    if (!['Processing', 'Ready', 'Delivered', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Choose a valid request status' });
    const [result] = await db.query(`UPDATE alumni_requests SET status=?,admin_note=?,
      ready_at=IF(?='Ready',COALESCE(ready_at,NOW()),ready_at), delivered_at=IF(?='Delivered',COALESCE(delivered_at,NOW()),delivered_at)
      WHERE request_id=?`, [status, String(req.body.admin_note || '').slice(0, 4000) || null, status, status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Alumni request not found' });
    res.json({ message: 'Alumni request updated' });
  } catch (err) { next(err); }
};
