const assert = require('node:assert/strict');
const test = require('node:test');
const { bindParameters, prepareSql } = require('./sql');

test('binds scalar and list parameters while preserving quoted question marks', () => {
  const bound = bindParameters(
    "SELECT * FROM users WHERE user_id IN (?) AND email = ? AND note = '?'",
    [[2, 3], 'user@example.edu']
  );

  assert.deepEqual(bound, {
    sql: "SELECT * FROM users WHERE user_id IN ($1, $2) AND email = $3 AND note = '?'",
    values: [2, 3, 'user@example.edu'],
  });
});

test('does not bind question marks inside SQL comments', () => {
  const bound = bindParameters('SELECT ? -- ignore ?\n/* also ? */', [1]);
  assert.deepEqual(bound, { sql: 'SELECT $1 -- ignore ?\n/* also ? */', values: [1] });
});

test('turns empty list parameters into NULL', () => {
  assert.deepEqual(bindParameters('SELECT * FROM users WHERE user_id IN (?)', [[]]), {
    sql: 'SELECT * FROM users WHERE user_id IN (NULL)',
    values: [],
  });
});

test('rejects parameter count mismatches', () => {
  assert.throws(() => bindParameters('SELECT ?', []), /parameter count/);
  assert.throws(() => bindParameters('SELECT 1', [1]), /parameter count/);
});

test('prepares insert statements for PostgreSQL generated IDs', () => {
  assert.deepEqual(prepareSql('INSERT INTO users (email) VALUES (?);'), {
    sql: 'INSERT INTO users (email) VALUES (?) RETURNING *',
    table: 'users',
  });
});

test('preserves conflict updates and translates INSERT IGNORE', () => {
  assert.deepEqual(prepareSql('INSERT IGNORE INTO invoices (number) VALUES (?)'), {
    sql: 'INSERT INTO invoices (number) VALUES (?) ON CONFLICT DO NOTHING RETURNING *',
    table: 'invoices',
  });
  assert.deepEqual(prepareSql('INSERT INTO grades (enrollment_id) VALUES (?) ON CONFLICT (enrollment_id) DO UPDATE SET enrollment_id = EXCLUDED.enrollment_id'), {
    sql: 'INSERT INTO grades (enrollment_id) VALUES (?) ON CONFLICT (enrollment_id) DO UPDATE SET enrollment_id = EXCLUDED.enrollment_id RETURNING *',
    table: 'grades',
  });
});
