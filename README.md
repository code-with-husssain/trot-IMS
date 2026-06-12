# Trot TK — Invoice Management & Tracking System

A MERN-stack web app for **Trot TK** to onboard clients, generate invoices (matching the
company's invoice format), track invoice statuses, and monitor revenue via a dashboard with
client & year filters.

- **Auth:** single seeded admin login (JWT). Clients do not log in.
- **Invoices:** generated in the Trot TK format, with a changeable status workflow
  (`pending → approved → received → paid`, plus `overdue` / `cancelled`) and **PDF download**.
- **Dashboard:** revenue KPIs, monthly-revenue chart, top clients, filterable by client & year.
- **Stack:** MongoDB Atlas · Express · React (Vite) · Node · Tailwind CSS.
- **Primary color:** `rgb(255, 131, 97)` (`#FF8361`).

## Project structure

```
.
├── client/    # React + Vite + Tailwind frontend
├── server/    # Express + Mongoose API (also Vercel serverless entry at server/api/index.js)
└── vercel.json
```

## Prerequisites

- Node.js 18+
- A free **MongoDB Atlas** M0 cluster ([atlas.mongodb.com](https://www.mongodb.com/atlas/database))

## Local setup

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the backend
cp server/.env.example server/.env
#   then edit server/.env and set:
#   - MONGODB_URI   (your Atlas connection string)
#   - JWT_SECRET    (any long random string)
#   - ADMIN_EMAIL / ADMIN_PASSWORD (the admin login you want)

# 3. Seed the admin user
npm run seed

# 4. Run the API (terminal 1)  -> http://localhost:5000
npm run dev:server

# 5. Run the frontend (terminal 2) -> http://localhost:5173
npm run dev:client
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so just open
**http://localhost:5173** and log in with your seeded admin credentials.

## Environment variables

| Variable         | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `MONGODB_URI`    | MongoDB Atlas connection string                        |
| `JWT_SECRET`     | Secret used to sign JWTs                                |
| `ADMIN_EMAIL`    | Seeded admin email (login)                             |
| `ADMIN_PASSWORD` | Seeded admin password (login)                          |
| `ADMIN_NAME`     | Seeded admin display name                              |
| `CLIENT_ORIGIN`  | Allowed CORS origin(s), comma-separated (dev: 5173)    |
| `PORT`           | API port for local dev (default 5000)                  |

## API overview

| Method | Endpoint                     | Purpose                                  |
| ------ | ---------------------------- | ---------------------------------------- |
| POST   | `/api/auth/login`            | Admin login → JWT                        |
| GET    | `/api/auth/me`               | Current admin                            |
| GET/POST/PUT/DELETE | `/api/clients`    | Client CRUD                              |
| GET    | `/api/clients/:id`           | Client + their invoices                  |
| GET/POST/PUT/DELETE | `/api/invoices`   | Invoice CRUD (totals computed server-side) |
| PATCH  | `/api/invoices/:id/status`   | Change invoice status                    |
| GET    | `/api/dashboard?clientId=&year=` | Aggregated metrics                  |

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In Vercel, **Import** the GitHub repo. The included `vercel.json` builds the React client
   (static) and deploys `server/api/index.js` as a serverless function under `/api/*`.
3. Add the same environment variables (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_*`) in
   **Project → Settings → Environment Variables**. Set `CLIENT_ORIGIN` to your Vercel URL.
4. Deploy. After the first deploy, seed the admin once — either run `npm run seed` locally
   pointed at the same `MONGODB_URI`, or temporarily run the seed in any environment with the
   production connection string.

## Notes

- Invoice totals (`amount = hours × rate`, subtotal, total) are always recomputed on the server.
- Invoice numbers auto-increment atomically via a `Counter` collection and are zero-padded
  (e.g. `00024`) to match the sample format.
- PDF export is rendered client-side from the on-screen invoice, so the download matches the
  styled view exactly.
