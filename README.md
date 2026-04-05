# EstateHub — Rental Management Platform

Luxury editorial rental management platform built with Node.js, TypeScript, Express, PostgreSQL, and vanilla HTML/CSS.

---

## Quick Start (under 10 minutes)

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 2. Create the database
```bash
psql -U postgres -c "CREATE DATABASE estatehub"
psql -U postgres -d estatehub -f schema.sql
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env if your Postgres credentials differ from the defaults
```

### 4. Install and run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Node.js + TypeScript + Express |
| Database | PostgreSQL (via `pg` pool) |
| Frontend | HTML + Tailwind CSS (CDN) + Vanilla JS |
| Fonts    | DM Sans + DM Serif Display |

---

## Project Structure

```
realtor/
├── schema.sql              ← Database schema + seed data
├── package.json
├── tsconfig.json
├── .env.example
├── public/
│   └── index.html          ← Full single-page frontend
└── src/
    ├── index.ts            ← Express entry point
    ├── db/
    │   └── pool.ts         ← pg Pool + query/transaction helpers
    ├── types/
    │   └── index.ts        ← Shared TypeScript interfaces
    └── routes/
        ├── dashboard.ts
        ├── properties.ts
        ├── tenants.ts
        ├── leases.ts
        ├── payments.ts
        └── maintenance.ts
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Stats, recent payments, alerts |
| GET | `/api/properties` | List with `?search`, `?status`, `?type`, `?city` |
| POST | `/api/properties` | Create property |
| PUT | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| GET | `/api/tenants` | List tenants with active lease info |
| POST | `/api/tenants` | Create tenant |
| PUT | `/api/tenants/:id` | Update tenant |
| DELETE | `/api/tenants/:id` | Delete tenant |
| GET | `/api/leases` | List leases with joined property/tenant data |
| POST | `/api/leases` | Create lease + auto-mark property occupied (transaction) |
| PUT | `/api/leases/:id` | Update lease status |
| GET | `/api/payments` | List all payments |
| POST | `/api/payments` | Create payment record |
| PUT | `/api/payments/:id` | Mark paid / update status |
| GET | `/api/maintenance` | List all maintenance requests |
| POST | `/api/maintenance` | Log new issue |
| PUT | `/api/maintenance/:id` | Update status/priority |

---

## Seed Data

The schema includes:
- **2 landlords** (James Worthington, Sophia Chen)
- **3 properties** (London penthouse, Kensington flat, Cotswold cottage)
- **3 tenants** with credit scores and verification status
- **2 active leases** with payment history
- **4 maintenance requests** across priority levels

---

## Scripts

```bash
npm run dev    # ts-node-dev with hot reload
npm run build  # compile TypeScript to dist/
npm start      # run compiled dist/index.js
```

---

## Design

Inspired by fluid.glass — luxury editorial aesthetic:
- Off-white cream background (`#faf9f6`)
- DM Serif Display headings, DM Sans body
- Warm gold accent (`#c8a96e`)
- Floating blur nav, card hover lifts, smooth animations
- Kanban maintenance board, credit score visualizations, status badges
