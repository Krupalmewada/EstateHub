import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

const router = Router();

// GET /api/maintenance
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT m.*,
             p.title AS property_title,
             p.address AS property_address,
             t.name AS tenant_name
      FROM maintenance m
      JOIN properties p ON p.id = m.property_id
      LEFT JOIN tenants t ON t.id = m.tenant_id
      ORDER BY
        CASE m.priority
          WHEN 'emergency' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        m.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch maintenance requests', details: message });
  }
});

// POST /api/maintenance
router.post('/', async (req: Request, res: Response) => {
  try {
    const { property_id, tenant_id, title, description, priority } = req.body;
    if (!property_id || !title) {
      return res.status(400).json({ error: 'property_id and title are required' });
    }

    const result = await query(`
      INSERT INTO maintenance (property_id, tenant_id, title, description, priority)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [property_id, tenant_id ?? null, title, description ?? null, priority ?? 'medium']);

    res.status(201).json({ data: result.rows[0], message: 'Maintenance request created' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create maintenance request', details: message });
  }
});

// PUT /api/maintenance/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, title, description } = req.body;

    const resolvedAt = status === 'resolved' ? 'NOW()' : 'NULL';

    const result = await query(`
      UPDATE maintenance
      SET status=$1, priority=$2, title=$3, description=$4,
          resolved_at=${resolvedAt}
      WHERE id=$5
      RETURNING *
    `, [status, priority, title, description, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json({ data: result.rows[0], message: 'Maintenance request updated' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update maintenance request', details: message });
  }
});

export default router;
