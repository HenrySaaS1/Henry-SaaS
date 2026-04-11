# HENRY Local SaaS Starter

React frontend and Node.js backend scaffold that matches your demo landing page sections.

## Run locally

1. **PostgreSQL** — the app uses PostgreSQL (same as Azure production). Easiest option:

   ```bash
   docker compose up -d
   ```

   Or install PostgreSQL locally and create a database.

2. **Backend**

   - `cd backend`
   - `copy .env.example .env` — set `DATABASE_URL` (see `.env.example`) and a strong `JWT_SECRET`
   - `npm install` (generates Prisma client via `postinstall`; if Windows reports EPERM on Prisma engine files, stop any running `npm run dev`, then run `npm install` again)
   - `npx prisma migrate deploy` (creates tables; first time only)
   - `npm run db:seed` (optional — demo tenant `ops@harlandmedical.com`; see `prisma/seed.js`)
   - `npm run dev`

3. **Frontend** (new terminal)

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

## Deploy to Azure (GitHub → public website)

You get a **Static Web App** URL for the React site and an **App Service** URL for the API. Wire them together with GitHub secrets and Azure app settings.

### 1. Azure resources (portal)

1. **Resource group** — e.g. `henry-rg`.
2. **Azure Database for PostgreSQL — Flexible Server**
   - Create server + database; allow Azure services (or your App Service outbound IPs) to connect.
   - Connection string for Prisma (replace placeholders):

     `postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require`

3. **App Service (Linux, Node 20)** — e.g. name `henry-api` → URL `https://henry-api.azurewebsites.net`
   - **Configuration → Application settings** (add as **Application settings**, not only Connection strings):

     | Name | Example |
     |------|---------|
     | `DATABASE_URL` | `postgresql://...?sslmode=require` |
     | `JWT_SECRET` | long random string |
     | `CORS_ORIGIN` | your Static Web App URL (no trailing slash), e.g. `https://happy-rock-012345678.azurestaticapps.net` |
     | `NODE_ENV` | `production` |

   - **Configuration → General settings → Startup Command**: `npm run start`  
     (`start` runs `prisma migrate deploy` then the server.)

4. **Static Web App** — connect the **same GitHub repo**; framework “Custom”, or rely on the workflow below.
   - After creation, note the site URL (e.g. `https://<name>.azurestaticapps.net`).

5. **CORS** — set `CORS_ORIGIN` on the Web App to exactly that Static Web App URL (including `https://`). Redeploy backend after changing it.

### 2. GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions**.

**Frontend** (workflow: `.github/workflows/azure-static-web-apps.yml`):

| Secret | Value |
|--------|--------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure Portal → your Static Web App → **Manage deployment token** |
| `VITE_API_URL` | Backend public URL, no trailing slash, e.g. `https://henry-api.azurewebsites.net` |

**Backend** (workflow: `.github/workflows/azure-app-service-backend.yml`):

| Secret | Value |
|--------|--------|
| `AZURE_WEBAPP_NAME` | Web App name (e.g. `henry-api`) |
| `AZURE_WEBAPP_BACKEND_PUBLISH_PROFILE` | Entire contents of **Download publish profile** from the Web App |

Push to `main` (or use **Actions → Run workflow**) to deploy. The frontend workflow builds with `npm ci && npm run build` and injects `VITE_API_URL` at build time.

### 3. Custom domain (optional)

- **Static Web App**: Custom domains in the Static Web App resource.
- **App Service**: Custom domains on the Web App; update `CORS_ORIGIN` and GitHub `VITE_API_URL` if the API hostname changes.

### 4. Troubleshooting

- **API 500 / Prisma errors** — check `DATABASE_URL` and firewall; Flexible Server often needs `sslmode=require`.
- **Browser CORS** — `CORS_ORIGIN` must match the exact frontend origin (scheme + host, no path).
- **Frontend calls wrong API** — rebuild frontend after changing `VITE_API_URL` (it is baked in at build time).

Link GitHub to Azure using **Deployment Center** on each resource, or use only these workflows once the secrets above are set.
