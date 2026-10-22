USE university_db;

ALTER TABLE users
  MODIFY role ENUM('admin','registrar','instructor','student','finance','dean') NOT NULL;

ALTER TABLE access_requests
  MODIFY role ENUM('student','registrar','instructor','head','admin','finance','dean') NOT NULL;

-- Older databases without the dean enum value stored those requests as an empty role.
UPDATE access_requests
SET role = 'dean'
WHERE role = ''
  AND JSON_EXTRACT(applicant_data, '$.college_id') IS NOT NULL;
