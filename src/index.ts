import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import dashboardRouter from './routes/dashboard';
import propertiesRouter from './routes/properties';
import tenantsRouter from './routes/tenants';
import leasesRouter from './routes/leases';
import paymentsRouter from './routes/payments';
import maintenanceRouter from './routes/maintenance';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'EstateHub API', timestamp: new Date().toISOString() });
});

app.use('/api/dashboard',   dashboardRouter);
app.use('/api/properties',  propertiesRouter);
app.use('/api/tenants',     tenantsRouter);
app.use('/api/leases',      leasesRouter);
app.use('/api/payments',    paymentsRouter);
app.use('/api/maintenance', maintenanceRouter);

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ┌─────────────────────────────────────┐`);
  console.log(`  │   EstateHub API running on :${PORT}    │`);
  console.log(`  │   http://localhost:${PORT}              │`);
  console.log(`  └─────────────────────────────────────┘\n`);
});

export default app;
