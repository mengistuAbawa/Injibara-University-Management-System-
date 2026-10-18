-- Adds applicant, alumni, and finance data structures to university_db.
-- Apply after the base university_db.sql schema.
USE university_db;

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','registrar','instructor','student','finance') NOT NULL;

ALTER TABLE access_requests
  MODIFY COLUMN role ENUM('student','registrar','instructor','head','admin','finance') NOT NULL;

ALTER TABLE access_requests
  ADD COLUMN registrar_note TEXT NULL;

CREATE TABLE IF NOT EXISTS applicant_profiles (
  applicant_id INT AUTO_INCREMENT PRIMARY KEY,
  access_request_id INT NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  grandfather_name VARCHAR(50),
  gender ENUM('Male','Female'),
  date_of_birth DATE,
  phone_number VARCHAR(15),
  region VARCHAR(50),
  high_school_name VARCHAR(150),
  high_school_region VARCHAR(50),
  university_entrance_result DECIMAL(7,2),
  first_choice_department INT,
  second_choice_department INT,
  third_choice_department INT,
  transcript_url VARCHAR(255),
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_applicant_profiles_request (access_request_id),
  INDEX idx_applicant_profiles_choices (first_choice_department, second_choice_department, third_choice_department),
  FOREIGN KEY (access_request_id) REFERENCES access_requests(request_id) ON DELETE CASCADE,
  FOREIGN KEY (first_choice_department) REFERENCES departments(department_id),
  FOREIGN KEY (second_choice_department) REFERENCES departments(department_id),
  FOREIGN KEY (third_choice_department) REFERENCES departments(department_id)
);

CREATE TABLE IF NOT EXISTS alumni_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  request_type ENUM('transcript','degree_verification','recommendation','replacement_id') NOT NULL,
  purpose TEXT,
  status ENUM('Pending','Processing','Ready','Delivered','Rejected') DEFAULT 'Pending',
  admin_note TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ready_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  INDEX idx_alumni_requests_student_date (student_id, requested_at),
  INDEX idx_alumni_requests_status (status, requested_at),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alumni_contact (
  student_id INT PRIMARY KEY,
  current_email VARCHAR(100),
  current_phone VARCHAR(15),
  current_address TEXT,
  employer VARCHAR(150),
  job_title VARCHAR(150),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fee_types (
  fee_id INT AUTO_INCREMENT PRIMARY KEY,
  fee_name VARCHAR(100) NOT NULL,
  fee_category ENUM('tuition','dormitory','library','registration','other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  semester ENUM('I','II','Summer') NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fee_types_period (academic_year, semester),
  INDEX idx_fee_types_category (fee_category)
);

CREATE TABLE IF NOT EXISTS student_invoices (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  student_id INT NOT NULL,
  fee_id INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  semester ENUM('I','II','Summer') NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status ENUM('Unpaid','Partial','Paid','Waived','Overdue') DEFAULT 'Unpaid',
  due_date DATE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_invoices_student (student_id, status),
  INDEX idx_student_invoices_period (academic_year, semester, status),
  INDEX idx_student_invoices_fee (fee_id),
  UNIQUE KEY uq_student_fee_period (student_id, fee_id, academic_year, semester),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (fee_id) REFERENCES fee_types(fee_id)
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('Cash','Bank','Telebirr','CBE Birr','Waiver','Other') NOT NULL,
  reference_number VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by INT NOT NULL,
  INDEX idx_payments_invoice_date (invoice_id, paid_at),
  INDEX idx_payments_received_by (received_by, paid_at),
  FOREIGN KEY (invoice_id) REFERENCES student_invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(user_id)
);

-- Development account; change this password after the first login.
INSERT INTO users (username, first_name, last_name, email, password_hash, role)
VALUES ('INUFINANCE', 'Finance', 'Officer', 'finance@inu.edu.et', '$2b$10$mx33a6d5qH5vLGCtPb3R5eBHRDO5VVYWZiCSEqQPcavRFgys.2vpC', 'finance')
ON DUPLICATE KEY UPDATE email = VALUES(email);
