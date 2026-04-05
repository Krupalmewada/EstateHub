import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

const router = Router();

// GET /api/properties — with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status, city, type } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.title ILIKE $${idx} OR p.address ILIKE $${idx} OR p.city ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
    if (city)   { conditions.push(`p.city ILIKE $${idx++}`); params.push(`%${city}%`); }
    if (type)   { conditions.push(`p.type = $${idx++}`); params.push(type); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT p.*, l.name AS landlord_name
      FROM properties p
      JOIN landlords l ON l.id = p.landlord_id
      ${where}
      ORDER BY p.created_at DESC
    `, params);

    res.json({ data: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch properties', details: message });
  }
});

// POST /api/properties
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      landlord_id, title, description, address, city, postcode,
      type, bedrooms, bathrooms, area_sqft, rent_pcm, amenities
    } = req.body;

    if (!landlord_id || !title || !address || !city || !postcode || !type || !rent_pcm) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO properties
        (landlord_id, title, description, address, city, postcode, type,
         bedrooms, bathrooms, area_sqft, rent_pcm, amenities)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [landlord_id, title, description ?? null, address, city, postcode,
        type, bedrooms ?? 1, bathrooms ?? 1, area_sqft ?? null,
        rent_pcm, amenities ?? []]);

    res.status(201).json({ data: result.rows[0], message: 'Property created' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create property', details: message });
  }
});

// PUT /api/properties/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title, description, address, city, postcode, type,
      bedrooms, bathrooms, area_sqft, rent_pcm, status, amenities
    } = req.body;

    const result = await query(`
      UPDATE properties SET
        title=$1, description=$2, address=$3, city=$4, postcode=$5,
        type=$6, bedrooms=$7, bathrooms=$8, area_sqft=$9, rent_pcm=$10,
        status=$11, amenities=$12, updated_at=NOW()
      WHERE id=$13
      RETURNING *
    `, [title, description ?? null, address, city, postcode,
        type, bedrooms, bathrooms, area_sqft ?? null,
        rent_pcm, status, amenities ?? [], id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: result.rows[0], message: 'Property updated' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to update property', details: message });
  }
});

// DELETE /api/properties/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM properties WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: { id }, message: 'Property deleted' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to delete property', details: message });
  }
});

export default router;
