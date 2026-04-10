# HENRY Local SaaS Starter

React frontend and Node.js backend scaffold that matches your demo landing page sections.

## Run locally

1. Backend
   - `cd backend`
   - `copy .env.example .env` (set `DATABASE_URL` and `JWT_SECRET`; defaults work for local SQLite)
   - `npm install` (generates Prisma client via `postinstall`)
   - `npx prisma migrate dev` (creates SQLite DB and tables; first time only)
   - `npm run db:seed` (optional — demo tenant `ops@harlandmedical.com`; see `prisma/seed.js`)
   - `npm run dev`

2. Frontend (new terminal)
   - `cd frontend`
   - `npm install`
   - `npm run dev`

Frontend runs at `http://localhost:5173` and API runs at `http://localhost:5000`.

## API endpoints

- `GET /api/health`
- `GET /api/auth/check-email?email=`
- `POST /api/auth/register` — body: `email`, `password`, `company`, `productIds[]`, optional `planId`
- `POST /api/auth/login` — body: `email`, `password`
- `GET /api/auth/me` — header: `Authorization: Bearer <token>`
- `POST /api/contact` — saves to DB; optional same header to attach signed-in user

Accounts and demo requests are stored in SQLite (`prisma/dev.db` by default). For production, point `DATABASE_URL` at PostgreSQL and run `npx prisma migrate deploy`.

## Deploy to Azure (GitHub → Azure)

The repo includes two GitHub Actions workflows (push to `main`):

1. **Frontend — [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/getting-started)**  
   Workflow: `.github/workflows/azure-static-web-apps.yml`  
   In GitHub → **Settings → Secrets and variables → Actions**, add:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` — Azure Portal → your Static Web App → **Manage deployment token**
   - `VITE_API_URL` — backend base URL with no trailing slash, e.g. `https://<your-app>.azurewebsites.net`

2. **Backend — [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs)** (Linux, Node 20)  
   Workflow: `.github/workflows/azure-app-service-backend.yml`  
   Add secrets:
   - `AZURE_WEBAPP_NAME` — Web App resource name (e.g. `henry-api`)
   - `AZURE_WEBAPP_BACKEND_PUBLISH_PROFILE` — full contents of the **Download publish profile** file from the Web App

   In Azure → Web App → **Configuration → Application settings**, set at least:
   - `DATABASE_URL` — use [Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview) in production (update `provider` in `prisma/schema.prisma` to `postgresql` and run migrations)
   - `JWT_SECRET` — long random string
   - `CORS_ORIGIN` — your Static Web App URL (e.g. `https://<name>.azurestaticapps.net`)
   - `NODE_ENV` = `production`

   **Startup command** (Configuration → General settings): `npm run start`  
   **First-time database:** from your machine or Cloud Shell, with production `DATABASE_URL`:  
   `cd backend && npx prisma migrate deploy`

Link GitHub to Azure using **Deployment Center** on each resource, or rely on these workflows after the secrets above are set.
