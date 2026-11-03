const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const db = require('./config/db');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

// Routes
const authRoutes        = require('./routes/authRoutes');
const studentRoutes     = require('./routes/studentRoutes');
const instructorRoutes  = require('./routes/instructorRoutes');
const courseRoutes      = require('./routes/courseRoutes');
const departmentRoutes  = require('./routes/departmentRoutes');
const enrollmentRoutes  = require('./routes/enrollmentRoutes');
const gradeRoutes       = require('./routes/gradeRoutes');
const fieldRoutes       = require('./routes/fieldRoutes');
const selectionRoutes   = require('./routes/selectionRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const registrarRoutes   = require('./routes/registrarRoutes');
const hodRoutes         = require('./routes/hodRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const financeRoutes = require('./routes/financeRoutes');
const deanRoutes = require('./routes/deanRoutes');

const app = express();

let courseCategorySchemaPromise;
const ensureCourseCategorySchema = () => {
  if (!courseCategorySchemaPromise) {
    courseCategorySchemaPromise = db.query(
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'Major Course'"
    ).catch((err) => {
      courseCategorySchemaPromise = undefined;
      throw err;
    });
  }
  return courseCategorySchemaPromise;
};

let deanSchemaPromise;
const ensureDeanSchema = () => {
  if (!deanSchemaPromise) {
    const deanColumns = [
      'employee_number VARCHAR(30)',
      'first_name VARCHAR(50)',
      'last_name VARCHAR(50)',
      'gender VARCHAR(20)',
      'phone_number VARCHAR(30)',
      'academic_rank VARCHAR(50)',
      'office_location VARCHAR(100)',
      'hire_date DATE',
      'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ];
    deanSchemaPromise = deanColumns.reduce(
      (promise, definition) => promise.then(() =>
        db.query(`ALTER TABLE college_deans ADD COLUMN IF NOT EXISTS ${definition}`)
      ),
      Promise.resolve()
    ).then(() =>
      Promise.all([
        db.query('ALTER TABLE colleges ADD COLUMN IF NOT EXISTS dean_user_id INT'),
        db.query('ALTER TABLE colleges ADD COLUMN IF NOT EXISTS dean_name VARCHAR(120)'),
      ])
    ).catch((err) => {
      deanSchemaPromise = undefined;
      throw err;
    });
  }
  return deanSchemaPromise;
};

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const normalizedOrigin = (origin) => origin.replace(/\/+$/, '');

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random value of at least 32 characters in production.');
  }
}

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server and same-origin requests that do not send an Origin header.
    const allowDeployedFrontend = process.env.NODE_ENV === 'production' && /^https:\/\//i.test(origin || '');
    const developmentOrigin = process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (!origin || developmentOrigin || allowedOrigins.includes(normalizedOrigin(origin)) || (allowedOrigins.length === 0 && allowDeployedFrontend)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '12mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'INU Portal API running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

ensureCourseCategorySchema().catch((err) => {
  process.stderr.write(`Database schema initialization failed: ${err.message}\n`);
});
ensureDeanSchema().catch((err) => {
  process.stderr.write(`Dean database schema initialization failed: ${err.message}\n`);
});

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth',         authRoutes);
app.use('/api/public',       applicantRoutes);
app.use('/api/alumni',       alumniRoutes);
app.use('/api/finance',      financeRoutes);
app.use('/api/profile',      profileRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/instructors',  instructorRoutes);
app.use('/api/courses',      courseRoutes);
app.use('/api/departments',  departmentRoutes);
app.use('/api/enrollments',  enrollmentRoutes);
app.use('/api/grades',       gradeRoutes);
app.use('/api/fields',       fieldRoutes);
app.use('/api/selections',   selectionRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/registrar', registrarRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/hod',       hodRoutes);
app.use('/api/dean', deanRoutes);
// Every API path is authenticated unless one of the route handlers above has already served it.
app.use('/api', protect);
app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found' }));
// Error handler (must be last)
app.use(errorHandler);
module.exports = app;

// Vercel imports this file as a serverless Express handler. Keep the listener
// for local development and traditional Node.js hosting only.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`Server listening on port ${PORT}\n`);
    db.query('SELECT 1').catch((err) => {
      process.stderr.write(`PostgreSQL connection failed: ${err.message}\n`);
    });
  });
}
