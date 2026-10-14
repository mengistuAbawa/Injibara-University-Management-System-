-- Allow administrators to create course sections before a department head
-- assigns an instructor. Run once against an existing university_db.
ALTER TABLE sections
  MODIFY instructor_id INT NULL;
