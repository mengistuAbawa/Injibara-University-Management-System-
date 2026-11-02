const db = require('../config/db');

exports.requireHod = async (req, res, next) => {
  try {
    if (req.user?.role !== 'instructor' || !req.user?.instructor_id) {
      return res.status(403).json({ message: 'HOD access only' });
    }
    const [[instructor]] = await db.query(
      `SELECT instructor_id, is_hod, hod_department_id
       FROM instructors
       WHERE instructor_id = ? AND is_hod = TRUE AND user_id = ? LIMIT 1`,
      [req.user.instructor_id, req.user.id]
    );
    if (!instructor) {
      return res.status(403).json({ message: 'HOD access only' });
    }
    req.user.hod_department_id = instructor.hod_department_id;
    req.user.is_hod = true;
    next();
  } catch (error) {
    next(error);
  }
};