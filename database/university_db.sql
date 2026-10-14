CREATE DATABASE IF NOT EXISTS university_db;
USE university_db;

CREATE TABLE colleges (
    college_id INT AUTO_INCREMENT PRIMARY KEY,
    college_name VARCHAR(120) NOT NULL UNIQUE,
    college_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    id INT PRIMARY KEY,
    current_academic_year VARCHAR(10) NOT NULL DEFAULT '2025/2026',
    current_semester ENUM('I','II','Summer') NOT NULL DEFAULT 'I',
    registration_open BOOLEAN NOT NULL DEFAULT TRUE,
    field_selection_open BOOLEAN NOT NULL DEFAULT FALSE,
    field_selection_start DATETIME NULL,
    field_selection_end DATETIME NULL
);

-- Users
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(40) UNIQUE,
    avatar_path   VARCHAR(255),
    first_name    VARCHAR(50),
    last_name     VARCHAR(50),
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin','registrar','instructor','student') NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE access_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('student','registrar','instructor','head','admin') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    applicant_data LONGTEXT NOT NULL,
    status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    INDEX idx_access_requests_review (role, status, submitted_at),
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Departments
CREATE TABLE departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    faculty         VARCHAR(100),
    college_id      INT,
    capacity        INT NOT NULL DEFAULT 50,
    min_score       DECIMAL(7,2) NOT NULL DEFAULT 0,
    is_available_for_selection BOOLEAN NOT NULL DEFAULT TRUE,
    hod_user_id     INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
);

-- Students
CREATE TABLE students (
    student_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNIQUE NOT NULL,
    student_number   VARCHAR(20) UNIQUE NOT NULL,
    first_name       VARCHAR(50) NOT NULL,
    last_name        VARCHAR(50) NOT NULL,
    grandfather_name VARCHAR(50),
    gender           ENUM('Male','Female'),
    date_of_birth    DATE,
    phone_number     VARCHAR(15),
    region           VARCHAR(50),
    department_id    INT,
    admission_year   INT,
    current_year     INT DEFAULT 1,
    dormitory        VARCHAR(100),
    campus           VARCHAR(100),
    building_no      VARCHAR(30),
    building_name    VARCHAR(100),
    floor             VARCHAR(20),
    dorm              VARCHAR(50),
    bed_no            VARCHAR(30),
    handicapped_case  VARCHAR(50),
    university_entrance_result DECIMAL(7,2),
    status           ENUM('Active','Graduated','Suspended','Withdrawn') DEFAULT 'Active',
    FOREIGN KEY (user_id)       REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Instructors
CREATE TABLE instructors (
    instructor_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNIQUE NOT NULL,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    gender          ENUM('Male','Female'),
    phone_number    VARCHAR(15),
    academic_rank   ENUM('Graduate Assistant','Lecturer','Assistant Professor',
                         'Associate Professor','Professor') NOT NULL,
    department_id   INT,
    office_location VARCHAR(50),
    hire_date       DATE,
    is_hod          BOOLEAN NOT NULL DEFAULT FALSE,
    hod_department_id INT,
    FOREIGN KEY (user_id)       REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (hod_department_id) REFERENCES departments(department_id)
);

-- Courses
CREATE TABLE courses (
    course_id     INT AUTO_INCREMENT PRIMARY KEY,
    course_code   VARCHAR(15) UNIQUE NOT NULL,
    course_title  VARCHAR(150) NOT NULL,
    credit_hours  INT NOT NULL,
    department_id INT NOT NULL,
    year_level    INT NOT NULL,
    semester      ENUM('I','II','Summer') NOT NULL,
    is_elective   BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Sections
CREATE TABLE sections (
    section_id    INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT NOT NULL,
    instructor_id INT NULL,
    academic_year VARCHAR(10) NOT NULL,
    semester      ENUM('I','II','Summer') NOT NULL,
    room          VARCHAR(20),
    schedule      VARCHAR(100),
    capacity      INT DEFAULT 50,
    FOREIGN KEY (course_id)     REFERENCES courses(course_id),
    FOREIGN KEY (instructor_id) REFERENCES instructors(instructor_id)
);

-- Enrollments
CREATE TABLE enrollments (
    enrollment_id   INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    section_id      INT NOT NULL,
    academic_year   VARCHAR(10) NOT NULL,
    enrollment_date DATE DEFAULT (CURRENT_DATE),
    status          ENUM('Enrolled','Dropped','Completed') DEFAULT 'Enrolled',
    UNIQUE KEY unique_enrollment (student_id, section_id, academic_year),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE
);

-- Student registration requests (registrar-reviewed course selections)
CREATE TABLE student_registration_requests (
    request_id    INT AUTO_INCREMENT PRIMARY KEY,
    student_id    INT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    status        ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    student_note  TEXT,
    registrar_note TEXT,
    submitted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by   INT NULL,
    reviewed_at   TIMESTAMP NULL,
    INDEX idx_registration_requests_student (student_id, submitted_at),
    INDEX idx_registration_requests_review (status, submitted_at),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE student_registration_request_sections (
    request_id INT NOT NULL,
    section_id INT NOT NULL,
    PRIMARY KEY (request_id, section_id),
    FOREIGN KEY (request_id) REFERENCES student_registration_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE
);

-- Grades
CREATE TABLE grades (
    grade_id        INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id   INT UNIQUE NOT NULL,
    assignment_mark DECIMAL(5,2) DEFAULT 0,
    midterm_mark    DECIMAL(5,2) DEFAULT 0,
    final_mark      DECIMAL(5,2) DEFAULT 0,
    total_mark      DECIMAL(5,2) DEFAULT 0,
    letter_grade    VARCHAR(2),
    grade_point     DECIMAL(3,2),
    recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE
);

-- Attendance
CREATE TABLE attendance (
    attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id   INT NOT NULL,
    attendance_date DATE NOT NULL,
    status          ENUM('Present','Absent','Late','Excused') NOT NULL,
    UNIQUE KEY unique_attendance_day (enrollment_id, attendance_date),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id) ON DELETE CASCADE
);

-- Fields
CREATE TABLE fields (
    field_id   INT AUTO_INCREMENT PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    department_id INT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- Field Selections
CREATE TABLE field_selections (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    field_id   INT NOT NULL,
    priority   INT NOT NULL,
    UNIQUE KEY unique_student_field (student_id, field_id),
    UNIQUE KEY unique_student_priority (student_id, priority),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (field_id)   REFERENCES fields(field_id)
);

-- Selection Results
CREATE TABLE selection_results (
    result_id    INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    field_id     INT NOT NULL,
    department_id INT NULL,
    status       VARCHAR(50) DEFAULT 'Assigned',
    announced_on DATE,
    UNIQUE KEY uniq_student (student_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (field_id)   REFERENCES fields(field_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

CREATE TABLE sms_logs (
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

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_hod_user FOREIGN KEY (hod_user_id) REFERENCES users(user_id) ON DELETE SET NULL;
