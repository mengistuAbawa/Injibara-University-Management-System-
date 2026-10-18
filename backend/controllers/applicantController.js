/** Public admission application endpoints, including document storage and status lookup. */
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads', 'applications');
const saveDocument = (value, name, allowedMime) => {
  if (!value) return null;
  const match = /^data:(application\/pdf|image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match || !allowedMime.includes(match[1])) throw Object.assign(new Error(`Invalid ${name} file type`), { status: 400 });
  const data = Buffer.from(match[2], 'base64');
  if (!data.length || data.length > 5 * 1024 * 1024) throw Object.assign(new Error(`${name} must be smaller than 5 MB`), { status: 400 });
  fs.mkdirSync(uploadDir, { recursive: true });
  const extension = match[1] === 'application/pdf' ? '.pdf' : match[1] === 'image/png' ? '.png' : '.jpg';
  const filename = `${Date.now()}-${require('crypto').randomBytes(8).toString('hex')}${extension}`;
  fs.writeFileSync(path.join(uploadDir, filename), data, { flag: 'wx' });
  return `/uploads/applications/${filename}`;
};

exports.departments = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT department_id, department_name, capacity, min_score,
      (SELECT COUNT(*) FROM students s WHERE s.department_id = d.department_id AND s.status <> 'Withdrawn') AS enrolled
      FROM departments d WHERE is_available_for_selection = TRUE ORDER BY department_name`);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.apply = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { email, first_name, last_name, grandfather_name, gender, date_of_birth, phone_number, region,
      high_school_name, high_school_region, university_entrance_result, first_choice_department, second_choice_department,
      third_choice_department, transcript, photo } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const score = Number(university_entrance_result);
    const choices = [first_choice_department, second_choice_department, third_choice_department].map((v) => Number(v));
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date_of_birth || '') && !Number.isNaN(Date.parse(`${date_of_birth}T00:00:00Z`)) && new Date(`${date_of_birth}T00:00:00Z`).toISOString().slice(0, 10) === date_of_birth;
    if (normalizedEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof first_name !== 'string' || typeof last_name !== 'string' || typeof grandfather_name !== 'string' ||
      typeof phone_number !== 'string' || typeof region !== 'string' || typeof high_school_name !== 'string' || typeof high_school_region !== 'string' ||
      !first_name?.trim() || !last_name?.trim() || !grandfather_name?.trim() || !['Male', 'Female'].includes(gender) ||
      !validDate || !phone_number?.trim() || !region?.trim() ||
      !high_school_name?.trim() || !high_school_region?.trim() || !Number.isFinite(score) || score < 0 || score > 999.99 ||
      [first_name,last_name,grandfather_name,region,high_school_region].some((v)=>String(v||'').trim().length>50) ||
      String(phone_number||'').trim().length>15 || String(high_school_name||'').trim().length>150 ||
      choices.some((id) => !Number.isInteger(id) || id < 1) || new Set(choices).size !== 3) {
      return res.status(400).json({ message: 'Complete all required fields and choose three different departments' });
    }
    if (!transcript || !photo) return res.status(400).json({ message: 'Upload both a transcript PDF and a photo' });
    const [[existing]] = await conn.query('SELECT user_id FROM users WHERE email = ? UNION SELECT request_id FROM access_requests WHERE email = ? LIMIT 1', [normalizedEmail, normalizedEmail]);
    if (existing) return res.status(409).json({ message: 'An account or application already uses this email' });
    const [departments] = await conn.query('SELECT department_id FROM departments WHERE department_id IN (?) AND is_available_for_selection = TRUE', [choices]);
    if (departments.length !== 3) return res.status(400).json({ message: 'One or more selected departments are unavailable' });
    const transcriptUrl = saveDocument(transcript, 'transcript', ['application/pdf']);
    const photoUrl = saveDocument(photo, 'photo', ['image/jpeg', 'image/png']);
    const details = { first_name: first_name.trim(), last_name: last_name.trim(), grandfather_name: grandfather_name.trim(), gender,
      date_of_birth, phone_number: phone_number.trim(), region: region.trim(), high_school_name: high_school_name.trim(),
      high_school_region: high_school_region.trim(), university_entrance_result: score, department_id: choices[0] };
    await conn.beginTransaction();
    const [request] = await conn.query('INSERT INTO access_requests (role, email, password_hash, applicant_data) VALUES (\'student\', ?, ?, ?)',
      [normalizedEmail, require('../utils/hashPassword').hash(require('../utils/generateTempPassword')(details.grandfather_name)), JSON.stringify(details)]);
    await conn.query(`INSERT INTO applicant_profiles (access_request_id, first_name, last_name, grandfather_name, gender, date_of_birth,
      phone_number, region, high_school_name, high_school_region, university_entrance_result, first_choice_department,
      second_choice_department, third_choice_department, transcript_url, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [request.insertId, details.first_name, details.last_name, details.grandfather_name, gender, date_of_birth, details.phone_number,
        details.region, details.high_school_name, details.high_school_region, score, ...choices, transcriptUrl, photoUrl]);
    await conn.commit();
    res.status(201).json({ request_id: request.insertId, email: normalizedEmail, message: 'Application submitted successfully' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account or application already uses this email' });
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  } finally { conn.release(); }
};

exports.applicationStatus = async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    const [rows] = await db.query(`SELECT ar.request_id,ar.status,ar.submitted_at,ar.registrar_note,s.student_number,u.username
      FROM access_requests ar LEFT JOIN users u ON u.email=ar.email LEFT JOIN students s ON s.user_id=u.user_id
      WHERE ar.email=? AND ar.role='student' ORDER BY ar.submitted_at DESC LIMIT 1`, [email]);
    if (!rows.length) return res.status(404).json({ message: 'No application was found for that email' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
