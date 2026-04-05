import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { DashboardStats } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Property counts
    const propStats = await query<{ total: string; occupied: string }>(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'occupied') AS occupied
      FROM properties
    `);

    const total = parseInt(propStats.rows[0].total, 10);
    const occupied = parseInt(propStats.rows[0].occupied, 10);
    const occupancy_rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    // Monthly revenue (sum of active lease rent_pcm)
    const revenueRes = await query<{ revenue: string }>(`
      SELECT COALESCE(SUM(rent_pcm), 0) AS revenue
      FROM leases WHERE status = 'active'
    `);
    const monthly_revenue = parseFloat(revenueRes.rows[0].revenue);

    // Outstanding payments (pending + late)
    const outstandingRes = await query<{ outstanding: string }>(`
      SELECT COALESCE(SUM(amount), 0) AS outstanding
      FROM payments WHERE status IN ('pending', 'late')
    `);
    const outstanding_payments = parseFloat(outstandingRes.rows[0].outstanding);

    // Open maintenance count
    const maintRes = await query<{ open_count: string }>(`
      SELECT COUNT(*) AS open_count FROM maintenance
      WHERE status IN ('open', 'in_progress')
    `);
    const open_maintenance = parseInt(maintRes.rows[0].open_count, 10);

    // Recent payments (last 10)
    const paymentsRes = await query(`
      SELECT p.*, l.rent_pcm as lease_rent,
             pr.title AS property_title,
             t.name AS tenant_name
      FROM payments p
      JOIN leases l ON l.id = p.lease_id
      JOIN properties pr ON pr.id = l.property_id
      JOIN tenants t ON t.id = l.tenant_id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    // Maintenance alerts (open/in_progress, highest priority first)
    const alertsRes = await query(`
      SELECT m.*,
             pr.title AS property_title,
             t.name AS tenant_name
      FROM maintenance m
      JOIN properties pr ON pr.id = m.property_id
      LEFT JOIN tenants t ON t.id = m.tenant_id
      WHERE m.status IN ('open', 'in_progress')
      ORDER BY
        CASE m.priority
          WHEN 'emergency' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        m.created_at DESC
      LIMIT 8
    `);

    const stats: DashboardStats = {
      total_properties: total,
      occupied_properties: occupied,
      occupancy_rate,
      monthly_revenue,
      outstanding_payments,
      open_maintenance,
      recent_payments: paymentsRes.rows as any,
      maintenance_alerts: alertsRes.rows as any,
    };

    res.json({ data: stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to load dashboard', details: message });
  }
});

export default router;
