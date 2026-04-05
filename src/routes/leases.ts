import { Router, Request, Response } from 'express';
import { query, withTransaction } from '../db/pool';
import { PoolClient } from 'pg';

const router = Router();

// GET /api/leases
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT l.*,
             p.title AS property_title,
             p.address AS property_address,
             t.name AS tenant_name,
             t.email AS tenant_email,
             (l.end_date - CURRENT_DATE) AS days_remaining
      FROM leases l
      JOIN properties p ON p.id = l.property_id
      JOIN tenants t ON t.id = l.tenant_id
      ORDER BY l.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch leases', details: message });
  }
});

// POST /api/leases — transactional: insert lease + update property status
router.post('/', async (req: Request, res: Response) => {
  try {
    const { property_id, tenant_id, start_date, end_date, rent_pcm, deposit } = req.body;
    if (!property_id || !tenant_id || !start_date || !end_date || !rent_pcm || !deposit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lease = await withTransaction(async (client: PoolClient) => {
      // Check property exists and is available
      const propCheck = await client.query(
        'SELECT status FROM properties WHERE id=$1',
        [property_id]
      );
      if (propCheck.rowCount === 0) throw new Error('Property not found');
      if (propCheck.rows[0].status === 'occupied') throw new Error('Property is already occupied');

      // Insert lease
      const leaseRes = await client.query(`
        INSERT INTO leases (property_id, tenant_id, start_date, end_date, rent_pcm, deposit, status)
        VALUES ($1,$2,$3,$4,$5,$6,'active')
        RETURNING *
      `, [property_id, tenant_id, start_date, end_date, rent_pcm, deposit]);

      // Update property status
      await client.query(
        "UPDATE properties SET status='occupied', updated_at=NOW() WHERE id=$1",
        [property_id]
      );

      return leaseRes.rows[0];
    });

    res.status(201).json({ data: lease, message: 'Lease created and property marked occupied' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : message.includes('occupied') ? 409 : 500;
    res.status(status).json({ error: 'Failed to create lease', details: message });
  }
});

// PUT /api/leases/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, rent_pcm, deposit, status } = req.body;

    const result = await query(`
      UPDATE leases SET start_date=$1, end_date=$2, rent_pcm=$3, deposit=$4, status=$5
      WHERE id=$6 RETURNING *
    `, [start_date, end_date, rent_pcm, deposit, status, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Lease not found' });

    // If terminated/expired, free up the property
    if (status === 'terminated' || status === 'expired') {
      await query(
        "UPDATE properties SET status='available', updated_at=NOW() WHERE id=(SELECT property_id FROM leases WHERE id=$1)",
        [id]
      );
    }

    res.json({ data: result.rows[0], message: 'Lease updated' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update lease', details: message });
  }
});

export default router;
