/** Restricts student-authenticated requests to accounts whose student status is Graduated. */
const db = require('../config/db');

module.exports = async (req, res, next) => {
  if (!req.user || req.user.role !== 'student' || !req.user.student_id) {
    return res.status(403).json({ message: 'Graduated student account required' });
  }
  try {
    const [[student]] = await db.query('SELECT status FROM students WHERE student_id = ?', [req.user.student_id]);
    if (!student || student.status !== 'Graduated') return res.status(403).json({ message: 'Alumni access is available to graduated students' });
    next();
  } catch (err) { next(err); }
};
