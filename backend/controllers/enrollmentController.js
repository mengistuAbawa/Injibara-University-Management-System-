const db = require('../config/db');

exports.enroll = async (req, res, next) => {
  try {
    const { student_id, section_id, academic_year } = req.body;

    const [cap] = await db.query(
      `SELECT (SELECT capacity FROM sections WHERE section_id = ?) AS capacity,
              (SELECT COUNT(*) FROM enrollments WHERE section_id = ? AND status='Enrolled') AS taken`,
      [section_id, section_id]
    );
    if (cap[0].taken >= cap[0].capacity) {
      return res.status(400).json({ message: 'Section full' });
    }

    await db.query(
      `INSERT INTO enrollments (student_id, section_id, academic_year)
       VALUES (?, ?, ?)`,
      [student_id, section_id, academic_year]
    );
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (err) { next(err); }
};

exports.listByStudent = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM enrollments WHERE student_id = ?`,
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};