const db = require('../config/db');

async function getStudentStatus(req) {
  if (!req.user || req.user.role !== 'student' || !req.user.student_id) return null;
  const [[student]] = await db.query(
    'SELECT status FROM students WHERE student_id = ?',
    [req.user.student_id]
  );
  return student?.status || null;
}

async function requireAlumni(req, res, next) {
  try {
    if (await getStudentStatus(req) !== 'Graduated') {
      return res.status(403).json({ message: 'Alumni access only' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

async function rejectGraduatedStudent(req, res, next) {
  try {
    const status = await getStudentStatus(req);
    if (!status) {
      return res.status(403).json({ message: 'Student account not found.' });
    }
    if (status === 'Graduated') {
      return res.status(403).json({
        message: 'Graduated students must use alumni services.',
        redirect: '/alumni/dashboard',
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAlumni, rejectGraduatedStudent };
