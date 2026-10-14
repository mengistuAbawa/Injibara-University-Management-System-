const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(morgan('dev'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'INU Portal API running' });
});

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth',         authRoutes);
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
// Every API path is authenticated unless one of the route handlers above has already served it.
app.use('/api', protect);
app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found' }));
// Error handler (must be last)
app.use(errorHandler);
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ MySQL connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
})();
