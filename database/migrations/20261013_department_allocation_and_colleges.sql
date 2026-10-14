USE university_db;

CREATE TABLE IF NOT EXISTS colleges (
  college_id INT AUTO_INCREMENT PRIMARY KEY,
  college_name VARCHAR(120) NOT NULL UNIQUE,
  college_code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY,
  current_academic_year VARCHAR(10) NOT NULL DEFAULT '2025/2026',
  current_semester ENUM('I','II','Summer') NOT NULL DEFAULT 'I',
  registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  field_selection_open BOOLEAN NOT NULL DEFAULT FALSE,
  field_selection_start DATETIME NULL,
  field_selection_end DATETIME NULL
);

ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS college_id INT NULL,
  ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS min_score DECIMAL(7,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available_for_selection BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL;

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS department_id INT NULL,
  ADD CONSTRAINT fk_fields_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL;

ALTER TABLE selection_results
  ADD COLUMN IF NOT EXISTS department_id INT NULL,
  ADD CONSTRAINT fk_selection_results_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL;

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS field_selection_start DATETIME NULL,
  ADD COLUMN IF NOT EXISTS field_selection_end DATETIME NULL;

CREATE TABLE IF NOT EXISTS sms_logs (
  sms_log_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NULL,
  phone_number VARCHAR(30) NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  provider_response TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sms_logs_created (created_at),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL
);
