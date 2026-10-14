const db = require('../config/db');
const { getLetterAndPoint } = require('../utils/calculateGPA');

exports.upsert = async (req, res, next) => {
  try {
    const { enrollment_id, assignment_mark, midterm_mark, final_mark } = req.body;
    const total = Number(assignment_mark) + Number(midterm_mark) + Number(final_mark);
    const { letter, point } = getLetterAndPoint(total);

    await db.query(
      `INSERT INTO grades
        (enrollment_id, assignment_mark, midterm_mark, final_mark,
         total_mark, letter_grade, grade_point)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         assignment_mark = VALUES(assignment_mark),
         midterm_mark    = VALUES(midterm_mark),
         final_mark      = VALUES(final_mark),
         total_mark      = VALUES(total_mark),
         letter_grade    = VALUES(letter_grade),
         grade_point     = VALUES(grade_point)`,
      [enrollment_id, assignment_mark, midterm_mark, final_mark, total, letter, point]
    );

    res.json({ message: 'Grade saved', total, letter, point });
  } catch (err) { next(err); }
};