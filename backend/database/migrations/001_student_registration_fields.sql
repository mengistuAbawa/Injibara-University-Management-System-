-- Run once against an existing university_db before using the expanded
-- student registration form. Fresh installations get these columns from
-- backend/database/university_db.sql.
ALTER TABLE students ADD COLUMN IF NOT EXISTS campus VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS building_no VARCHAR(30);
ALTER TABLE students ADD COLUMN IF NOT EXISTS building_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS floor VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS dorm VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS bed_no VARCHAR(30);
ALTER TABLE students ADD COLUMN IF NOT EXISTS handicapped_case VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_entrance_result NUMERIC(7,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS highschool_region VARCHAR(100);
