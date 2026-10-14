/**
 * Ethiopian university letter-grade scale
 */
const SCALE = [
  { min: 90, letter: 'A+', point: 4.00 },
  { min: 85, letter: 'A',  point: 4.00 },
  { min: 80, letter: 'A-', point: 3.75 },
  { min: 75, letter: 'B+', point: 3.50 },
  { min: 70, letter: 'B',  point: 3.00 },
  { min: 65, letter: 'B-', point: 2.75 },
  { min: 60, letter: 'C+', point: 2.50 },
  { min: 55, letter: 'C',  point: 2.00 },
  { min: 50, letter: 'C-', point: 1.75 },
  { min: 40, letter: 'D',  point: 1.00 },
  { min: 0,  letter: 'F',  point: 0.00 },
];

exports.getLetterAndPoint = (mark) => {
  const row = SCALE.find((s) => mark >= s.min);
  return { letter: row.letter, point: row.point };
};

exports.calculateGPA = (courses) => {
  // courses = [{ credit_hours, grade_point }, ...]
  const totalCredit = courses.reduce((a, c) => a + Number(c.credit_hours), 0);
  const weighted    = courses.reduce((a, c) => a + c.credit_hours * c.grade_point, 0);
  return totalCredit === 0 ? 0 : Number((weighted / totalCredit).toFixed(2));
};
