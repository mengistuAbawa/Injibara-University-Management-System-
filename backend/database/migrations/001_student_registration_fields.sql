-- Run once against an existing university_db before using the expanded
-- student registration form. Fresh installations get these columns from
-- backend/database/university_db.sql.
ALTER TABLE students
  ADD COLUMN campus VARCHAR(100) NULL AFTER dormitory,
  ADD COLUMN building_no VARCHAR(30) NULL AFTER campus,
  ADD COLUMN building_name VARCHAR(100) NULL AFTER building_no,
  ADD COLUMN floor VARCHAR(20) NULL AFTER building_name,
  ADD COLUMN dorm VARCHAR(50) NULL AFTER floor,
  ADD COLUMN bed_no VARCHAR(30) NULL AFTER dorm,
  ADD COLUMN handicapped_case VARCHAR(50) NULL AFTER bed_no,
  ADD COLUMN university_entrance_result DECIMAL(7,2) NULL AFTER handicapped_case;
