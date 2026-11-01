const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/db');
const { requireAlumni, rejectGraduatedStudent } = require('./alumniMiddleware');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('requireAlumni allows graduated student accounts', async (t) => {
  const originalQuery = db.query;
  t.after(() => { db.query = originalQuery; });
  db.query = async () => [[{ status: 'Graduated' }]];

  const res = response();
  let continued = false;
  await requireAlumni(
    { user: { role: 'student', student_id: 7 } },
    res,
    () => { continued = true; }
  );

  assert.equal(continued, true);
  assert.equal(res.statusCode, 200);
});

test('requireAlumni rejects non-graduated and non-student accounts', async (t) => {
  const originalQuery = db.query;
  t.after(() => { db.query = originalQuery; });
  db.query = async () => [[{ status: 'Active' }]];

  const activeResponse = response();
  await requireAlumni({ user: { role: 'student', student_id: 7 } }, activeResponse, () => {
    assert.fail('Active students must not pass the alumni guard.');
  });
  assert.equal(activeResponse.statusCode, 403);
  assert.equal(activeResponse.body.message, 'Alumni access only');

  const staffResponse = response();
  await requireAlumni({ user: { role: 'admin', id: 8 } }, staffResponse, () => {
    assert.fail('Non-student users must not pass the alumni guard.');
  });
  assert.equal(staffResponse.statusCode, 403);
  assert.equal(staffResponse.body.message, 'Alumni access only');
});

test('rejectGraduatedStudent blocks graduated accounts from student APIs', async (t) => {
  const originalQuery = db.query;
  t.after(() => { db.query = originalQuery; });
  db.query = async () => [[{ status: 'Graduated' }]];

  const res = response();
  await rejectGraduatedStudent({ user: { role: 'student', student_id: 7 } }, res, () => {
    assert.fail('Graduated students must not pass the student API guard.');
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.redirect, '/alumni/dashboard');
});
