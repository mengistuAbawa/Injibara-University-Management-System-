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
       ON CONFLICT (enrollment_id) DO UPDATE SET
         assignment_mark = EXCLUDED.assignment_mark,
         midterm_mark    = EXCLUDED.midterm_mark,
         final_mark      = EXCLUDED.final_mark,
         total_mark      = EXCLUDED.total_mark,
         letter_grade    = EXCLUDED.letter_grade,
         grade_point     = EXCLUDED.grade_point`,
      [enrollment_id, assignment_mark, midterm_mark, final_mark, total, letter, point]
    );

    res.json({ message: 'Grade saved', total, letter, point });
  } catch (err) { next(err); }
};