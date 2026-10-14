-- Apply to an existing university_db that was created before registration requests were added.
USE university_db;

CREATE TABLE IF NOT EXISTS student_registration_requests (
    request_id     INT AUTO_INCREMENT PRIMARY KEY,
    student_id     INT NOT NULL,
    academic_year  VARCHAR(10) NOT NULL,
    status         ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    student_note   TEXT,
    registrar_note TEXT,
    submitted_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by    INT NULL,
    reviewed_at    TIMESTAMP NULL,
    INDEX idx_registration_requests_student (student_id, submitted_at),
    INDEX idx_registration_requests_review (status, submitted_at),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS student_registration_request_sections (
    request_id INT NOT NULL,
    section_id INT NOT NULL,
    PRIMARY KEY (request_id, section_id),
    FOREIGN KEY (request_id) REFERENCES student_registration_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE
);
