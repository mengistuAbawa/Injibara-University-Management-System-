const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments ORDER BY department_name');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments WHERE department_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};