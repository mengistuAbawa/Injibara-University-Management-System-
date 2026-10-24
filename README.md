# Injibara University Online Student Information System

INU Portal is a React and Express university portal backed by PostgreSQL. It supports student, instructor, department head, college dean, registrar, finance, and administrator accounts.

## Requirements

- Node.js 20.19 or newer (or 22.12 or newer) and npm
- PostgreSQL 14 or newer

## Database setup

The backend now connects to PostgreSQL. Copy `backend/.env.example` to `backend/.env` and set your local PostgreSQL connection values. For an existing XAMPP database, first apply any outstanding MySQL migrations to the XAMPP source, then migrate its schema and data to an empty PostgreSQL database with `pgloader`. See [DEPLOYMENT.md](DEPLOYMENT.md) for backup, transfer, and cutover instructions.

The SQL files under `database/` and `backend/database/` are the existing MySQL schema, seed data, and historical MySQL migrations. Use them only to prepare the XAMPP source before transfer; they are not PostgreSQL scripts. Never load demo accounts into a live system.

The backend configuration is in `backend/.env`. Use `DATABASE_URL` for hosted PostgreSQL, or set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` (default `5432`), and `DB_SSL` for local PostgreSQL. Set a private `JWT_SECRET` before deploying, and never commit `.env`.

For production environment variables, frontend build settings, and database deployment notes, see [DEPLOYMENT.md](DEPLOYMENT.md).

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
