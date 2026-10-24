const db = require('../config/db');

exports.publishResult = async (req, res, next) => {
  try {
    const { student_id, field_id, status } = req.body;
    await db.query(
      `INSERT INTO selection_results (student_id, field_id, status, announced_on)
       VALUES (?, ?, ?, CURRENT_DATE)
       ON CONFLICT (student_id) DO UPDATE SET
         field_id = EXCLUDED.field_id,
         status = EXCLUDED.status,
         announced_on = EXCLUDED.announced_on`,
      [student_id, field_id, status || 'Assigned']
    );
    res.json({ message: 'Result published' });
  } catch (err) { next(err); }
};