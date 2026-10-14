-- Run once against an existing university_db to support account profile photos.
ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) NULL AFTER username;
ALTER TABLE users ADD COLUMN first_name VARCHAR(50) NULL AFTER avatar_path;
ALTER TABLE users ADD COLUMN last_name VARCHAR(50) NULL AFTER first_name;

UPDATE users u
LEFT JOIN students s ON s.user_id = u.user_id
LEFT JOIN instructors i ON i.user_id = u.user_id
SET u.first_name = COALESCE(s.first_name, i.first_name, u.first_name),
    u.last_name = COALESCE(s.last_name, i.last_name, u.last_name);
