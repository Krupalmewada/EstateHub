import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

const router = Router();

// GET /api/tenants
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT t.*,
        p.title AS current_property,
        l.id AS lease_id,
        l.status AS lease_status
      FROM tenants t
      LEFT JOIN leases l ON l.tenant_id = t.id AND l.status = 'active'
      LEFT JOIN properties p ON p.id = l.property_id
      ORDER BY t.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch tenants', details: message });
  }
});

// POST /api/tenants
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, id_verified, credit_score } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    const result = await query(`
      INSERT INTO tenants (name, email, phone, id_verified, credit_score)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, email, phone ?? null, id_verified ?? false, credit_score ?? null]);

    res.status(201).json({ data: result.rows[0], message: 'Tenant created' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('unique')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create tenant', details: message });
  }
});

// PUT /api/tenants/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, id_verified, credit_score } = req.body;

    const result = await query(`
      UPDATE tenants SET name=$1, email=$2, phone=$3, id_verified=$4, credit_score=$5
      WHERE id=$6 RETURNING *
    `, [name, email, phone ?? null, id_verified ?? false, credit_score ?? null, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ data: result.rows[0], message: 'Tenant updated' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update tenant', details: message });
  }
});

// DELETE /api/tenants/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM tenants WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ data: { id }, message: 'Tenant deleted' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to delete tenant', details: message });
  }
});

export default router;
