import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

const router = Router();

// GET /api/payments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT pay.*,
             p.title AS property_title,
             t.name AS tenant_name
      FROM payments pay
      JOIN leases l ON l.id = pay.lease_id
      JOIN properties p ON p.id = l.property_id
      JOIN tenants t ON t.id = l.tenant_id
      ORDER BY pay.due_date DESC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch payments', details: message });
  }
});

// POST /api/payments
router.post('/', async (req: Request, res: Response) => {
  try {
    const { lease_id, amount, due_date, method } = req.body;
    if (!lease_id || !amount || !due_date) {
      return res.status(400).json({ error: 'lease_id, amount, and due_date are required' });
    }

    const result = await query(`
      INSERT INTO payments (lease_id, amount, due_date, method)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [lease_id, amount, due_date, method ?? null]);

    res.status(201).json({ data: result.rows[0], message: 'Payment record created' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create payment', details: message });
  }
});

// PUT /api/payments/:id — mark paid or update status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, method, paid_date } = req.body;

    const resolvedPaidDate = status === 'paid'
      ? (paid_date ?? new Date().toISOString().split('T')[0])
      : paid_date ?? null;

    const result = await query(`
      UPDATE payments SET status=$1, method=$2, paid_date=$3
      WHERE id=$4 RETURNING *
    `, [status, method ?? null, resolvedPaidDate, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ data: result.rows[0], message: 'Payment updated' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update payment', details: message });
  }
});

export default router;
