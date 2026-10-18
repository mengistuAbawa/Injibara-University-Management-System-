# Injibara University Online Student Information System

INU Portal is a React and Express university portal backed by MySQL. It supports student, instructor, department head, registrar, and administrator accounts.

## Requirements

- Node.js 20.19 or newer (or 22.12 or newer) and npm
- XAMPP MySQL running on `localhost:3306`
- MySQL user `root` with a blank password for the default local configuration

## Database setup

In phpMyAdmin, import `database/university_db.sql`, then import `database/seed.sql`, then import `database/migrations/20261014_seed_colleges_and_departments.sql`. The schema creates `university_db`; the seed file inserts sample accounts and academic records; the final script adds the eight colleges and their departments from the supplied list. That script is safe to run more than once.

If `university_db` already exists and registration pages report that `student_registration_requests` is missing, import `database/migrations/20261011_student_registration_requests.sql` in phpMyAdmin. It creates both request tables without replacing existing data. For a fresh database, `university_db.sql` already includes them.

If an existing database predates department placement settings and the admin department list fails with a missing-column error, import `database/migrations/20261013_department_allocation_and_colleges.sql` in phpMyAdmin with `university_db` selected. It adds the colleges table and department capacity, score, and selection fields. Fresh databases created from `database/university_db.sql` already include them.

The backend configuration is in `backend/.env`. Change `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, and `JWT_SECRET` for your environment. Never reuse the development JWT secret in a deployed environment.

## Start the backend

```powershell
cd backend
npm install
npm run dev
```

The API listens on port 5000.

## Start the frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. Set `VITE_API_BASE_URL` in `frontend/.env` if the API runs elsewhere.

## Sample accounts

| Role | Username | Password | Redirect |
| --- | --- | --- | --- |
| Admin | `admin@inu.edu.et` | `admin123` | `/admin/dashboard` |
| Registrar | `reg@inu.edu.et` | `reg123` | `/registrar/dashboard` |
| Instructor and HOD | `dawit@inu.edu.et` | `inst123` | `/hod/dashboard` |
| Student | `INU0800343UR` | `abebe1234abcd#` | `/dashboard` |

Students may also sign in with their university email. Initial student passwords use the grandfather's name in lowercase without spaces, followed by `1234abcd#`.
