USE university_db;

INSERT INTO departments (department_name, department_code, faculty) VALUES
('Computer Science','CoSc','Faculty of Technology'),
('Electrical Engineering','ECEng','Faculty of Technology'),
('Civil Engineering','CEEng','Faculty of Technology'),
('Public Health','PH','Faculty of Health Sciences'),
('Business Administration','BA','Faculty of Business');

INSERT INTO users(email,password_hash,role) VALUES
('admin@inu.edu.et','$2b$10$wcVeCK4J/TYH84V4o1UGqOcdhCW1Kx2c/kFV.ouL2xCtBeJm3Ss4S','admin'),
('reg@inu.edu.et','$2b$10$XXR14h8pIGNCn4T7ThPEaehs7QUszg6zN4wt4dvHXxgvd8hv7cGFK','registrar'),
('dawit@inu.edu.et','$2b$10$6V.j67rVr7tpKdicKgTUSeqkGBoAJux95lktmmJ25Pb34cRF8p04C','instructor'),
('inu0800343ur@inu.edu.et','$2b$10$auDKxdn9wu.Az9lOuFJY4.46hc/CnxvwSQ68Fvy2SzQqQyxFJ884K','student');

INSERT INTO instructors(user_id,employee_number,first_name,last_name,gender,academic_rank,department_id,is_hod,hod_department_id)
VALUES(3,'INU-INS-001','Dawit','Tadesse','Male','Lecturer',1,TRUE,1);
UPDATE departments SET hod_user_id=3 WHERE department_id=1;

INSERT INTO students(user_id,student_number,first_name,last_name,grandfather_name,gender,date_of_birth,phone_number,region,department_id,admission_year,current_year,dormitory)
VALUES(4,'INU0800343UR','Getahun','Abebe','Abebe','Male','2003-05-12','0911234567','Amhara',1,2023,2,'Block A - 204');

INSERT INTO fields(field_name) VALUES ('Software Engineering'),('Networking and Security'),('Information Systems'),('Artificial Intelligence'),('Data Science');
INSERT INTO courses(course_code,course_title,credit_hours,department_id,year_level,semester) VALUES('CoSc 201','Data Structures',4,1,2,'I');
INSERT INTO sections(course_id,instructor_id,academic_year,semester,room,schedule,capacity) VALUES(1,1,'2025/2026','I','Room 204','Mon 8:00-10:00',50);
INSERT INTO enrollments(student_id,section_id,academic_year) VALUES(1,1,'2025/2026');
INSERT INTO grades(enrollment_id,assignment_mark,midterm_mark,final_mark,total_mark,letter_grade,grade_point) VALUES(1,20,25,40,85,'A',4.00);
INSERT INTO field_selections(student_id,field_id,priority) VALUES(1,1,1),(1,2,2),(1,4,3);


-- Assign the public INU + user number login name to seeded accounts.
UPDATE users u
LEFT JOIN students s ON s.user_id=u.user_id
LEFT JOIN instructors i ON i.user_id=u.user_id
SET u.username=CASE
  WHEN COALESCE(s.student_number,i.employee_number) IS NULL THEN CONCAT(0x494e55,u.user_id)
  WHEN UPPER(COALESCE(s.student_number,i.employee_number)) LIKE CONCAT(0x494e55,0x25) THEN UPPER(COALESCE(s.student_number,i.employee_number))
  ELSE CONCAT(0x494e55,UPPER(COALESCE(s.student_number,i.employee_number)))
END,
u.first_name=COALESCE(s.first_name,i.first_name,u.first_name),
u.last_name=COALESCE(s.last_name,i.last_name,u.last_name);
