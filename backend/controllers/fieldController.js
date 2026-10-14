const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM fields ORDER BY field_name');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { field_name } = req.body;
    await db.query('INSERT INTO fields (field_name) VALUES (?)', [field_name]);
    res.status(201).json({ message: 'Field created' });
  } catch (err) { next(err); }
};