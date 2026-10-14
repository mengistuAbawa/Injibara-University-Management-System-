-- Run once against an existing university_db to enable role based account requests.
CREATE TABLE IF NOT EXISTS access_requests (
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
