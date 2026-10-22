USE university_db;

INSERT INTO colleges (college_name, college_code) VALUES
  ('Business and Economics', 'COL01'),
  ('Social Science and Humanities', 'COL02'),
  ('Education and Behavioral Sciences', 'COL03'),
  ('Natural and Computational Science', 'COL04'),
  ('Engineering and Technology', 'COL05'),
  ('Agriculture', 'COL06'),
  ('Law', 'COL07'),
  ('Medicine and Health Sciences', 'COL08')
ON DUPLICATE KEY UPDATE college_name = VALUES(college_name);

ALTER TABLE users
  MODIFY role ENUM('admin','registrar','instructor','student','finance','dean') NOT NULL,
  ADD COLUMN college_id INT NULL,
  ADD CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL;

ALTER TABLE access_requests
  MODIFY role ENUM('student','registrar','instructor','head','admin','finance','dean') NOT NULL;

ALTER TABLE grades
  ADD COLUMN approval_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Approved';
