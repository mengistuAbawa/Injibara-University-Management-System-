INSERT INTO colleges (college_name, college_code)
VALUES ('Technology', 'TECH')
ON CONFLICT (college_code) DO NOTHING;

INSERT INTO departments (department_name, department_code, faculty, college_id)
SELECT 'Computer Science', 'CoSc', 'Faculty of Technology', college_id
FROM colleges WHERE college_code = 'TECH'
ON CONFLICT (department_code) DO NOTHING;
