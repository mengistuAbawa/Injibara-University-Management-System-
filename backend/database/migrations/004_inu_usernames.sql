-- Run once on an existing university_db to assign every account an INU-prefixed username.
ALTER TABLE users ADD COLUMN username VARCHAR(40) NULL UNIQUE AFTER user_id;

UPDATE users u
LEFT JOIN students s ON s.user_id = u.user_id
LEFT JOIN instructors i ON i.user_id = u.user_id
SET u.username = CASE
    WHEN COALESCE(s.student_number, i.employee_number) IS NULL THEN CONCAT('INU', u.user_id)
    WHEN UPPER(COALESCE(s.student_number, i.employee_number)) LIKE 'INU%' THEN UPPER(COALESCE(s.student_number, i.employee_number))
    ELSE CONCAT('INU', UPPER(COALESCE(s.student_number, i.employee_number)))
END
WHERE u.username IS NULL OR u.username = '';
