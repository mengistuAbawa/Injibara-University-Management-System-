-- Dean actor, department offerings, grade upload approvals, and audit trail.
USE university_db;

-- This migration extends the existing schema without recreating tables.
-- Conditional DDL keeps it safe to run after a partially applied migration.
SET @schema_name = DATABASE();

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='users' AND COLUMN_NAME='college_id') = 0,
  'ALTER TABLE users ADD COLUMN college_id INT NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='colleges' AND COLUMN_NAME='dean_user_id') = 0,
  'ALTER TABLE colleges ADD COLUMN dean_user_id INT NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='colleges' AND COLUMN_NAME='dean_name') = 0,
  'ALTER TABLE colleges ADD COLUMN dean_name VARCHAR(120) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='grades' AND COLUMN_NAME='finalized') = 0,
  'ALTER TABLE grades ADD COLUMN finalized BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='grades' AND COLUMN_NAME='finalized_at') = 0,
  'ALTER TABLE grades ADD COLUMN finalized_at TIMESTAMP NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='grades' AND COLUMN_NAME='finalized_by') = 0,
  'ALTER TABLE grades ADD COLUMN finalized_by INT NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='grades' AND COLUMN_NAME='approval_status') = 0,
  "ALTER TABLE grades ADD COLUMN approval_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Approved'", 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='access_requests' AND COLUMN_NAME='role') = 1,
  "ALTER TABLE access_requests MODIFY COLUMN role ENUM('student','registrar','instructor','head','admin','finance','dean') NOT NULL", 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS college_deans (
  dean_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  employee_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  gender ENUM('Male','Female') NULL,
  phone_number VARCHAR(15) NULL,
  academic_rank ENUM('Lecturer','Assistant Professor','Associate Professor','Professor') NOT NULL,
  college_id INT NOT NULL,
  office_location VARCHAR(50) NULL,
  hire_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_college_dean (college_id),
  CONSTRAINT fk_college_deans_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_college_deans_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS department_offerings (
  offering_id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  course_id INT NOT NULL,
  year_level INT NOT NULL,
  semester ENUM('I','II','Summer') NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_offering (department_id, course_id, academic_year, semester),
  CONSTRAINT fk_offerings_department FOREIGN KEY (department_id) REFERENCES departments(department_id),
  CONSTRAINT fk_offerings_course FOREIGN KEY (course_id) REFERENCES courses(course_id),
  CONSTRAINT fk_offerings_creator FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS grade_upload_approvals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  instructor_id INT NOT NULL,
  college_id INT NOT NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  dean_note TEXT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  UNIQUE KEY uniq_section_approval (section_id),
  CONSTRAINT fk_grade_approval_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
  CONSTRAINT fk_grade_approval_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id),
  CONSTRAINT fk_grade_approval_college FOREIGN KEY (college_id) REFERENCES colleges(college_id),
  CONSTRAINT fk_grade_approval_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dean_audit_logs (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  college_id INT NOT NULL,
  dean_user_id INT NOT NULL,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dean_audit_college (college_id, created_at),
  CONSTRAINT fk_dean_audit_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE,
  CONSTRAINT fk_dean_audit_user FOREIGN KEY (dean_user_id) REFERENCES users(user_id)
);

-- Preserve grade uploads that were already waiting for review before this migration.
INSERT INTO grade_upload_approvals (section_id,instructor_id,college_id,status,submitted_at)
SELECT sec.section_id,sec.instructor_id,d.college_id,'Pending',MIN(g.recorded_at)
FROM grades g JOIN enrollments e ON e.enrollment_id=g.enrollment_id
JOIN sections sec ON sec.section_id=e.section_id JOIN courses c ON c.course_id=sec.course_id
JOIN departments d ON d.department_id=c.department_id
WHERE g.approval_status='Pending' AND sec.instructor_id IS NOT NULL AND d.college_id IS NOT NULL
GROUP BY sec.section_id,sec.instructor_id,d.college_id
ON DUPLICATE KEY UPDATE approval_id=approval_id;

SET @ddl = IF(
  NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema_name AND TABLE_NAME='colleges' AND CONSTRAINT_NAME='fk_colleges_dean'),
  'ALTER TABLE colleges ADD CONSTRAINT fk_colleges_dean FOREIGN KEY (dean_user_id) REFERENCES users(user_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  NOT EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=@schema_name AND TABLE_NAME='users' AND COLUMN_NAME='college_id' AND REFERENCED_TABLE_NAME='colleges'),
  'ALTER TABLE users ADD CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema_name AND TABLE_NAME='grades' AND CONSTRAINT_NAME='fk_grades_finalized_by'),
  'ALTER TABLE grades ADD CONSTRAINT fk_grades_finalized_by FOREIGN KEY (finalized_by) REFERENCES users(user_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;
