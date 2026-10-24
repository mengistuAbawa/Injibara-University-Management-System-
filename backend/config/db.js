const { Pool } = require('pg');
const { bindParameters, prepareSql } = require('./sql');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT || 5432),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  connectionTimeoutMillis: 10000,
});

const insertIds = {
  alumni_requests: 'request_id',
  access_requests: 'request_id',
  attendance: 'attendance_id',
  college_deans: 'dean_id',
  colleges: 'college_id',
  courses: 'course_id',
  dean_audit_logs: 'audit_id',
  department_offerings: 'offering_id',
  departments: 'department_id',
  enrollments: 'enrollment_id',
  fee_types: 'fee_id',
  field_selections: 'id',
  fields: 'field_id',
  grade_upload_approvals: 'approval_id',
  grades: 'grade_id',
  instructors: 'instructor_id',
  payments: 'payment_id',
  sections: 'section_id',
  selection_results: 'result_id',
  sms_logs: 'sms_log_id',
  student_invoices: 'invoice_id',
  student_registration_requests: 'request_id',
  students: 'student_id',
  users: 'user_id',
};

async function queryWith(client, sql, parameters) {
  const prepared = prepareSql(sql);
  const bound = bindParameters(prepared.sql, parameters);
  let result;
  try {
    result = await client.query(bound.sql, bound.values);
  } catch (error) {
    if (error.code === '23505') error.code = 'ER_DUP_ENTRY';
    throw error;
  }

  if (/^\s*(SELECT|WITH)\b/i.test(sql)) return [result.rows];

  const inserted = /^\s*INSERT\b/i.test(sql);
  const insertedRow = result.rows[0];
  const insertIdColumn = insertIds[prepared.table];
  return [{
    affectedRows: result.rowCount,
    insertId: inserted && insertIdColumn && insertedRow ? insertedRow[insertIdColumn] : undefined,
  }];
}

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = {
  query: (sql, parameters) => queryWith(pool, sql, parameters),
  async getConnection() {
    const client = await pool.connect();
    return {
      query: (sql, parameters) => queryWith(client, sql, parameters),
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  },
  end: () => pool.end(),
};
