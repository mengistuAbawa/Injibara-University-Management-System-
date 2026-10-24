# PostgreSQL migration and deployment

This project uses PostgreSQL in the backend. A practical deployment for this repository is a managed PostgreSQL database, the Express API on Render, and the Vite frontend on Vercel. The API stores uploaded application documents and profile photos under `backend/uploads`, so mount persistent storage there when deploying the API.

## Migrate the XAMPP database

1. Stop application writes and make a backup of the current MySQL database. For example, from a terminal with XAMPP's `mysqldump` on `PATH`, run `mysqldump -u root -p --single-transaction university_db > university_db-backup.sql`. Enter the password at the prompt; do not put production credentials in this command or commit the backup.
2. Apply any outstanding MySQL migrations to the XAMPP database first. The migrations in this repository are MySQL-specific; do not run them against PostgreSQL.
3. Create an empty PostgreSQL database with your provider. On Windows, run `pgloader` from WSL2 or Docker, configured so it can reach both databases. If it runs in Docker, use `host.docker.internal` as the XAMPP host:

   ```text
   pgloader mysql://MYSQL_USER:MYSQL_PASSWORD@MYSQL_HOST:3306/university_db postgresql://PG_USER:PG_PASSWORD@PG_HOST:5432/PG_DATABASE
   ```

   Replace the connection details with URL-encoded credentials as necessary. For local XAMPP, use `127.0.0.1` when pgloader runs directly on the same machine. Keep the database private; do not expose XAMPP's MySQL port publicly.
4. Verify important table row counts and relationships in PostgreSQL before switching the app over. Keep the MySQL database and backup until the PostgreSQL deployment has been checked and accepted.

`pgloader` transfers the current schema and data and converts MySQL column/index types. It does not merge into an existing populated PostgreSQL database; use a new empty target for the initial migration. Schedule a write freeze or a final migration/cutover so records written during the transfer are not lost.

## Backend API on Render

- Create a Web Service from this repository with root directory `backend`, build command `npm ci`, and start command `npm start`. Use Node.js 20.19 or newer.
- Attach a persistent disk mounted at `/opt/render/project/src/backend/uploads` (the `uploads` directory for the `backend` root). Without this, uploaded files are lost when the service is redeployed or restarted. If your Render plan does not support persistent disks, use external object storage before launch.
- Set these environment variables in Render:
  - `NODE_ENV=production`
  - `DATABASE_URL` to the private PostgreSQL connection string
  - `DB_SSL=true` when the database requires TLS
  - `JWT_SECRET` to a private random value of at least 32 characters
  - `CORS_ORIGINS` to the exact Vercel frontend origin, including `https://`
  - Private `REGISTRAR_SIGNUP_CODE` and `ADMIN_SIGNUP_CODE` values if those signup flows are used
- Set the service health check path to `/`. The API returns JSON from this route.

The backend also supports discrete `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` values for local PostgreSQL. Never commit `.env` or put secrets in `VITE_*` variables.

## Frontend on Vercel

- Create a Vercel project from this repository with root directory `frontend`. Use `npm run build` and output directory `dist`. `frontend/vercel.json` routes browser paths to the SPA entry point.
- Set `VITE_API_BASE_URL` to the deployed API URL ending in `/api`, for example `https://inu-api.onrender.com/api`.
- Add the deployed frontend origin to the backend's `CORS_ORIGINS`, then redeploy the API.

Deploy the API first, then set the frontend environment variable and deploy the frontend. Vite embeds `VITE_API_BASE_URL` at build time, so changing it requires a new frontend build.

## Before opening access

Create the first administrator through a controlled setup process, replace or disable sample accounts, verify HTTPS for both services, and check login, registration, document uploads, and profile photos against the deployed database. Store production secrets only in the hosting providers' environment settings.
