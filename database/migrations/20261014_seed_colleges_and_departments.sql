-- Add the eight colleges/schools and their fields of study from the supplied list.
-- Safe to run more than once. Existing departments with the same name are attached
-- to the matching college instead of duplicated.
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

CREATE TEMPORARY TABLE image_departments (
  college_code VARCHAR(20) NOT NULL,
  department_code VARCHAR(10) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (department_code),
  UNIQUE KEY uq_image_department_name (department_name)
);

INSERT INTO image_departments (college_code, department_code, department_name) VALUES
('COL01','BUECO','Economics'),
('COL01','BUAF','Accounting & Finance'),
('COL01','BUMGT','Management'),
('COL01','BUMKT','Marketing Management'),
('COL01','BUPADM','Public Administration and Development Management'),
('COL01','BUTHM','Tourism and Hotel Management'),
('COL02','SHAMH','Ethiopian Language and Literature- Amharic'),
('COL02','SHAWN','Ethiopian Language and Literature- Awingi'),
('COL02','SHENG','English Language and Foreign Literature'),
('COL02','SHGEO','Geography and Environmental Studies'),
('COL02','SHCIV','Civic and Ethical Studies'),
('COL02','SHHIS','History and Heritage Management'),
('COL02','SHANT','Social Anthropology'),
('COL02','SHJOU','Journalism and Communication'),
('COL02','SHSOC','Sociology'),
('COL02','SHPOL','Political Science and Public Relation'),
('COL03','EDLLC','Life Long Learning and Community Development'),
('COL03','EDCCE','Early Child Care and Education'),
('COL03','EDPLM','Educational Planning and Management'),
('COL03','EDPSY','Psychology'),
('COL03','EDSNE','Special Needs and Inclusive Education'),
('COL03','EDTEC','Teacher Education and Curriculum Studies'),
('COL03','EDPGD','PGDT'),
('COL04','NCSBIO','Biotechnology'),
('COL04','NCSGEO','Geology'),
('COL04','NCSCHE','Chemistry'),
('COL04','NCSBIO2','Biology'),
('COL04','NCSMAT','Mathematics'),
('COL04','NCSPHY','Physics'),
('COL04','NCSSPT','Sport Science'),
('COL04','NCSSTA','Statistics'),
('COL05','ETIT','Information Technology'),
('COL05','ETIS','Information System'),
('COL05','ETCSC','Computer Science'),
('COL05','ETCIV','Civil Engineering'),
('COL05','ETHWR','Hydraulics and Water Resource Engineering'),
('COL05','ETECE','Electrical and Computer Engineering'),
('COL05','ETSWE','Software Engineering'),
('COL05','ETLAS','Land Administration and Surveying'),
('COL05','ETMIN','Mining'),
('COL06','AGFSP','Food Science and post-harvest Technology'),
('COL06','AGABC','Agri-Business and Value Chain Management'),
('COL06','AGAEC','Agricultural Economics'),
('COL06','AGANS','Animal Science'),
('COL06','AGFOR','Forestry'),
('COL06','AGHOR','Horticulture'),
('COL06','AGNRM','Natural Resource Management'),
('COL06','AGPLS','Plant Science'),
('COL06','AGRDE','Rural Development and Agricultural Extension'),
('COL06','AGVLT','Veterinary Laboratory Technology'),
('COL07','LAW','Law'),
('COL08','HSMED','Medicine'),
('COL08','HSPHA','Pharmacy'),
('COL08','HSMLS','Medical Laboratory Science'),
('COL08','HSNUR','Nursing'),
('COL08','HSPCH','Pediatrics and Child Health Nursing'),
('COL08','HSANE','Anesthesia'),
('COL08','HSMID','Midwifery'),
('COL08','HSEH','Environmental Health'),
('COL08','HSPSY','Psychiatry');

-- Match names first, so an existing row keeps its IDs and all student/course links.
UPDATE departments d
JOIN image_departments src ON LOWER(TRIM(d.department_name)) = LOWER(TRIM(src.department_name))
JOIN colleges c ON c.college_code = src.college_code
SET d.college_id = c.college_id;

-- Insert only missing department names. Generated short codes are stable and unique.
INSERT INTO departments (department_name, department_code, faculty, college_id)
SELECT src.department_name, src.department_code, NULL, c.college_id
FROM image_departments src
JOIN colleges c ON c.college_code = src.college_code
LEFT JOIN departments existing
  ON LOWER(TRIM(existing.department_name)) = LOWER(TRIM(src.department_name))
WHERE existing.department_id IS NULL
ON DUPLICATE KEY UPDATE college_id = VALUES(college_id);

-- The student placement workflow reads its choices from fields, so create one
-- choice for each department and connect it to that department.
INSERT INTO fields (field_name, department_id)
SELECT d.department_name, d.department_id
FROM image_departments src
JOIN departments d
  ON LOWER(TRIM(d.department_name)) = LOWER(TRIM(src.department_name))
LEFT JOIN fields f
  ON f.department_id = d.department_id
 AND LOWER(TRIM(f.field_name)) = LOWER(TRIM(d.department_name))
WHERE f.field_id IS NULL;

DROP TEMPORARY TABLE image_departments;
