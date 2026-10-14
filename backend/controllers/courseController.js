const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, d.department_name FROM courses c
       JOIN departments d ON c.department_id = d.department_id`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses WHERE course_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};