/** Resolve and enforce a dean's active college assignment from the dean profile. */
const db = require('../config/db');

exports.requireDean = async (req, res, next) => {
  try {
    if (req.user?.role !== 'instructor' || !req.user?.instructor_id) {
      return res.status(403).json({ message: 'Dean access only' });
    }
    const [[dean]] = await db.query(
      `SELECT cd.dean_id, cd.college_id, cd.is_active
       FROM college_deans cd JOIN instructors i ON i.user_id = cd.user_id
       WHERE i.instructor_id = ? LIMIT 1`, [req.user.instructor_id]);
    if (!dean || !dean.is_active) return res.status(403).json({ message: 'Dean access only' });
    req.user.dean_id = dean.dean_id;
    req.user.college_id = dean.college_id;
    req.user.is_dean = true;
    next();
  } catch (error) { next(error); }
};
