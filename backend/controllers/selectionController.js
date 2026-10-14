const db = require('../config/db');

exports.publishResult = async (req, res, next) => {
  try {
    const { student_id, field_id, status } = req.body;
    await db.query(
      `INSERT INTO selection_results (student_id, field_id, status, announced_on)
       VALUES (?, ?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE field_id = VALUES(field_id),
                               status = VALUES(status),
                               announced_on = VALUES(announced_on)`,
      [student_id, field_id, status || 'Assigned']
    );
    res.json({ message: 'Result published' });
  } catch (err) { next(err); }
};