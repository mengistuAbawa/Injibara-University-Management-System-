-- Idempotently seeds the 8 INU colleges and 61 undergraduate programs.
-- Department codes are used to associate programs with colleges, so this is safe
-- when the database already has colleges with different auto-increment IDs.
USE university_db;

INSERT INTO colleges (college_name, college_code) VALUES
('College of Agriculture, Food and Climate Sciences', 'CAFCS'),
('College of Business and Economics', 'CBE'),
('College of Education and Behavioral Science', 'CEBS'),
('College of Engineering and Technology', 'CET'),
('College of Medicine and Health Science', 'CMHS'),
('College of Natural and Computational Science', 'CNCS'),
('College of Social Science and Humanities', 'CSSH'),
('School of Law', 'LAW')
ON DUPLICATE KEY UPDATE
  college_name = VALUES(college_name),
  college_code = VALUES(college_code);

INSERT INTO departments
  (department_name, department_code, college_id, capacity, min_score, is_available_for_selection)
SELECT seed.department_name, seed.department_code, c.college_id, seed.capacity, seed.min_score, TRUE
FROM (
  SELECT 'CAFCS' college_code, 'Forestry' department_name, 'FOR' department_code, 50 capacity, 50.00 min_score UNION ALL
  SELECT 'CAFCS', 'Veterinary Laboratory Technology', 'VLT', 40, 52.00 UNION ALL
  SELECT 'CAFCS', 'Agri-business and Value Chain Management', 'ABVC', 45, 50.00 UNION ALL
  SELECT 'CAFCS', 'Plant Sciences', 'PLSC', 50, 48.00 UNION ALL
  SELECT 'CAFCS', 'Agricultural Economics', 'AGEC', 45, 50.00 UNION ALL
  SELECT 'CAFCS', 'Food and Post-harvest Technology', 'FPHT', 40, 52.00 UNION ALL
  SELECT 'CAFCS', 'Horticulture', 'HORT', 40, 48.00 UNION ALL
  SELECT 'CAFCS', 'Natural Resources Management', 'NRM', 50, 48.00 UNION ALL
  SELECT 'CAFCS', 'Rural Development and Agricultural Extension', 'RDAE', 45, 48.00 UNION ALL
  SELECT 'CAFCS', 'Animal Science', 'ANSC', 50, 50.00 UNION ALL
  SELECT 'CBE', 'Accounting and Finance', 'ACFN', 80, 60.00 UNION ALL
  SELECT 'CBE', 'Economics', 'ECON', 70, 58.00 UNION ALL
  SELECT 'CBE', 'Management', 'MGMT', 70, 55.00 UNION ALL
  SELECT 'CBE', 'Marketing Management', 'MKTG', 60, 55.00 UNION ALL
  SELECT 'CBE', 'Public Administration and Development Management', 'PADM', 50, 55.00 UNION ALL
  SELECT 'CBE', 'Tourism and Hotel Management', 'THM', 50, 52.00 UNION ALL
  SELECT 'CEBS', 'Early Childhood Care and Education', 'ECCE', 40, 50.00 UNION ALL
  SELECT 'CEBS', 'Educational Development Planning & Management', 'EDPM', 40, 52.00 UNION ALL
  SELECT 'CEBS', 'Life Long Learning and Community Development', 'LLCD', 40, 50.00 UNION ALL
  SELECT 'CEBS', 'Psychology', 'PSYC', 60, 55.00 UNION ALL
  SELECT 'CEBS', 'Special Needs and Inclusive Education', 'SNIE', 35, 50.00 UNION ALL
  SELECT 'CEBS', 'Teacher Education Curriculum Studies', 'TECS', 45, 52.00 UNION ALL
  SELECT 'CET', 'Civil Engineering', 'CENG', 80, 65.00 UNION ALL
  SELECT 'CET', 'Computer Science', 'CoSc', 90, 62.00 UNION ALL
  SELECT 'CET', 'Electrical and Computer Engineering', 'ECEG', 80, 65.00 UNION ALL
  SELECT 'CET', 'Hydraulic and Water Resource Engineering', 'HWRE', 60, 62.00 UNION ALL
  SELECT 'CET', 'Information System', 'IS', 70, 58.00 UNION ALL
  SELECT 'CET', 'Information Technology', 'IT', 70, 58.00 UNION ALL
  SELECT 'CET', 'Mining Engineering', 'MINE', 50, 65.00 UNION ALL
  SELECT 'CET', 'Land Administration and Surveying', 'LAS', 50, 60.00 UNION ALL
  SELECT 'CET', 'Software Engineering', 'SEng', 80, 62.00 UNION ALL
  SELECT 'CMHS', 'Anesthesia', 'ANES', 40, 70.00 UNION ALL
  SELECT 'CMHS', 'Biomedical', 'BIOM', 40, 68.00 UNION ALL
  SELECT 'CMHS', 'Environmental Health', 'ENVH', 50, 60.00 UNION ALL
  SELECT 'CMHS', 'Medical Laboratory Science', 'MLS', 50, 68.00 UNION ALL
  SELECT 'CMHS', 'Medicine', 'MED', 60, 80.00 UNION ALL
  SELECT 'CMHS', 'Midwifery', 'MIDW', 45, 65.00 UNION ALL
  SELECT 'CMHS', 'Nursing', 'NURS', 70, 62.00 UNION ALL
  SELECT 'CMHS', 'Pediatric and Child Health Nursing', 'PCHN', 40, 65.00 UNION ALL
  SELECT 'CMHS', 'Pharmacy', 'PHAR', 50, 72.00 UNION ALL
  SELECT 'CMHS', 'Psychiatry', 'PSYCH', 30, 70.00 UNION ALL
  SELECT 'CMHS', 'Public Health', 'PH', 60, 65.00 UNION ALL
  SELECT 'CNCS', 'Biology', 'BIOL', 70, 55.00 UNION ALL
  SELECT 'CNCS', 'Biotechnology', 'BTEC', 50, 58.00 UNION ALL
  SELECT 'CNCS', 'Chemistry', 'CHEM', 60, 52.00 UNION ALL
  SELECT 'CNCS', 'Geology', 'GEOL', 50, 55.00 UNION ALL
  SELECT 'CNCS', 'Mathematics', 'MATH', 60, 55.00 UNION ALL
  SELECT 'CNCS', 'Physics', 'PHYS', 60, 52.00 UNION ALL
  SELECT 'CNCS', 'Sport Science', 'SPSC', 40, 50.00 UNION ALL
  SELECT 'CNCS', 'Statistics', 'STAT', 50, 55.00 UNION ALL
  SELECT 'CSSH', 'Civics and Ethical Studies', 'CIVS', 50, 50.00 UNION ALL
  SELECT 'CSSH', 'English Language and Literature', 'ENGL', 70, 55.00 UNION ALL
  SELECT 'CSSH', 'Ethiopian Languages and Literature – Amharic', 'AMHR', 60, 50.00 UNION ALL
  SELECT 'CSSH', 'Ethiopian Languages and Literature – Awgni', 'AWGN', 40, 48.00 UNION ALL
  SELECT 'CSSH', 'Geography and Environmental Studies', 'GEES', 50, 50.00 UNION ALL
  SELECT 'CSSH', 'History and Heritage Management', 'HHM', 50, 50.00 UNION ALL
  SELECT 'CSSH', 'Journalism and Communications', 'JOUR', 50, 55.00 UNION ALL
  SELECT 'CSSH', 'Political Science and International Relations', 'PSIR', 60, 58.00 UNION ALL
  SELECT 'CSSH', 'Social Anthropology', 'SANT', 45, 50.00 UNION ALL
  SELECT 'CSSH', 'Sociology', 'SOCI', 50, 50.00 UNION ALL
  SELECT 'LAW', 'Law', 'LAW', 80, 65.00
) AS seed
JOIN colleges c ON c.college_code = seed.college_code
ON DUPLICATE KEY UPDATE
  department_name = VALUES(department_name),
  college_id = VALUES(college_id),
  capacity = VALUES(capacity),
  min_score = VALUES(min_score),
  is_available_for_selection = VALUES(is_available_for_selection);

-- Ensure each seeded department has a matching field row for the existing allocation system.
INSERT INTO fields (field_name, department_id)
SELECT d.department_name, d.department_id
FROM departments d
JOIN colleges c ON c.college_id = d.college_id
LEFT JOIN fields f ON f.department_id = d.department_id AND f.field_name = d.department_name
WHERE c.college_code IN ('CAFCS','CBE','CEBS','CET','CMHS','CNCS','CSSH','LAW')
  AND f.field_id IS NULL;
