CREATE TABLE IF NOT EXISTS colleges (
  college_id SERIAL PRIMARY KEY,
  college_name VARCHAR(120) NOT NULL UNIQUE,
  college_code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  department_id SERIAL PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  department_code VARCHAR(10) UNIQUE,
  faculty VARCHAR(100),
  college_id INT REFERENCES colleges(college_id) ON DELETE SET NULL,
  capacity INT NOT NULL DEFAULT 50,
  min_score NUMERIC(7,2) NOT NULL DEFAULT 0,
  is_available_for_selection BOOLEAN NOT NULL DEFAULT TRUE,
  hod_user_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(40) UNIQUE,
  avatar_path VARCHAR(255),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  college_id INT REFERENCES colleges(college_id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_requests (
  request_id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  applicant_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  student_id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  student_number VARCHAR(30) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  grandfather_name VARCHAR(50),
  gender VARCHAR(20),
  date_of_birth DATE,
  phone_number VARCHAR(15),
  region VARCHAR(50),
  department_id INT REFERENCES departments(department_id),
  admission_year INT,
  current_year INT DEFAULT 1,
  dormitory VARCHAR(100),
  campus VARCHAR(100),
  building_no VARCHAR(30),
  building_name VARCHAR(30),
  floor VARCHAR(20),
  bed_no VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS instructors (
  instructor_id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  employee_number VARCHAR(30) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  gender VARCHAR(20),
  phone_number VARCHAR(15),
  academic_rank VARCHAR(50) NOT NULL,
  department_id INT REFERENCES departments(department_id),
  office_location VARCHAR(100),
  hire_date DATE,
  is_hod BOOLEAN NOT NULL DEFAULT FALSE,
  hod_department_id INT REFERENCES departments(department_id)
);

CREATE TABLE IF NOT EXISTS college_deans (
  dean_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  employee_number VARCHAR(30),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  gender VARCHAR(20),
  phone_number VARCHAR(30),
  academic_rank VARCHAR(50),
  college_id INT NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
  office_location VARCHAR(100),
  hire_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  appointed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(30) NOT NULL,
  course_title VARCHAR(150) NOT NULL,
  credit_hours NUMERIC(4,1),
  department_id INT REFERENCES departments(department_id),
  year_level INT,
  semester VARCHAR(20),
  category VARCHAR(50) NOT NULL DEFAULT 'Major Course'
);

CREATE INDEX IF NOT EXISTS idx_access_requests_review
  ON access_requests(role, status, submitted_at);

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  current_academic_year VARCHAR(10) NOT NULL DEFAULT '2025/2026',
  current_semester VARCHAR(10) NOT NULL DEFAULT 'I',
  registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  field_selection_open BOOLEAN NOT NULL DEFAULT FALSE,
  field_selection_start TIMESTAMP,
  field_selection_end TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
  section_id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(course_id),
  instructor_id INT REFERENCES instructors(instructor_id),
  academic_year VARCHAR(10) NOT NULL,
  semester VARCHAR(10) NOT NULL,
  room VARCHAR(20),
  schedule VARCHAR(100),
  capacity INT DEFAULT 50
);

CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  section_id INT NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
  academic_year VARCHAR(10) NOT NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Enrolled',
  UNIQUE (student_id, section_id, academic_year)
);

CREATE TABLE IF NOT EXISTS student_registration_requests (
  request_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  academic_year VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  student_note TEXT,
  registrar_note TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_registration_request_sections (
  request_id INT NOT NULL REFERENCES student_registration_requests(request_id) ON DELETE CASCADE,
  section_id INT NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, section_id)
);

CREATE TABLE IF NOT EXISTS grades (
  grade_id SERIAL PRIMARY KEY,
  enrollment_id INT UNIQUE NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  assignment_mark NUMERIC(5,2) DEFAULT 0,
  midterm_mark NUMERIC(5,2) DEFAULT 0,
  final_mark NUMERIC(5,2) DEFAULT 0,
  total_mark NUMERIC(5,2) DEFAULT 0,
  letter_grade VARCHAR(2),
  grade_point NUMERIC(3,2),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'Approved',
  finalized BOOLEAN NOT NULL DEFAULT FALSE,
  finalized_at TIMESTAMP,
  finalized_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id SERIAL PRIMARY KEY,
  enrollment_id INT NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  UNIQUE (enrollment_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS fields (
  field_id SERIAL PRIMARY KEY,
  field_name VARCHAR(100) NOT NULL,
  department_id INT REFERENCES departments(department_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS field_selections (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  field_id INT NOT NULL REFERENCES fields(field_id),
  priority INT NOT NULL,
  UNIQUE (student_id, field_id),
  UNIQUE (student_id, priority)
);

CREATE TABLE IF NOT EXISTS selection_results (
  result_id SERIAL PRIMARY KEY,
  student_id INT UNIQUE NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  field_id INT NOT NULL REFERENCES fields(field_id),
  department_id INT REFERENCES departments(department_id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Assigned',
  announced_on DATE
);

CREATE TABLE IF NOT EXISTS sms_logs (
  sms_log_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(student_id) ON DELETE SET NULL,
  phone_number VARCHAR(30),
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  provider_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS department_offerings (
  offering_id SERIAL PRIMARY KEY,
  department_id INT NOT NULL REFERENCES departments(department_id),
  course_id INT NOT NULL REFERENCES courses(course_id),
  year_level INT NOT NULL,
  semester VARCHAR(10) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, course_id, academic_year, semester)
);

CREATE TABLE IF NOT EXISTS grade_upload_approvals (
  approval_id SERIAL PRIMARY KEY,
  section_id INT UNIQUE NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
  instructor_id INT NOT NULL REFERENCES instructors(instructor_id),
  college_id INT NOT NULL REFERENCES colleges(college_id),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  dean_note TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dean_audit_logs (
  audit_id SERIAL PRIMARY KEY,
  college_id INT NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
  dean_user_id INT NOT NULL REFERENCES users(user_id),
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id INT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applicant_profiles (
  applicant_id SERIAL PRIMARY KEY,
  access_request_id INT UNIQUE NOT NULL REFERENCES access_requests(request_id) ON DELETE CASCADE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  grandfather_name VARCHAR(50),
  gender VARCHAR(20),
  date_of_birth DATE,
  phone_number VARCHAR(15),
  region VARCHAR(100),
  high_school_name VARCHAR(150),
  high_school_region VARCHAR(50),
  university_entrance_result NUMERIC(7,2),
  first_choice_department INT REFERENCES departments(department_id),
  second_choice_department INT REFERENCES departments(department_id),
  third_choice_department INT REFERENCES departments(department_id),
  transcript_url VARCHAR(255),
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni_requests (
  request_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  request_type VARCHAR(30) NOT NULL,
  purpose TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  admin_note TEXT,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ready_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni_contact (
  student_id INT PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
  current_email VARCHAR(100),
  current_phone VARCHAR(15),
  current_address TEXT,
  employer VARCHAR(150),
  job_title VARCHAR(150),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_types (
  fee_id SERIAL PRIMARY KEY,
  fee_name VARCHAR(100) NOT NULL,
  fee_category VARCHAR(30) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  semester VARCHAR(10) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  fee_id INT NOT NULL REFERENCES fee_types(fee_id),
  academic_year VARCHAR(10) NOT NULL,
  semester VARCHAR(10) NOT NULL,
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
  due_date DATE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, fee_id, academic_year, semester)
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES student_invoices(invoice_id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method VARCHAR(30) NOT NULL,
  reference_number VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by INT NOT NULL REFERENCES users(user_id)
);
