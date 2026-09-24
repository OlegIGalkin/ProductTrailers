import { Router } from 'express';
import { getDb, rowToApi } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // Extract query parameters
    const { startDate, endDate } = req.query;

    // Base query
    let sql = 'SELECT * FROM videos WHERE 1=1';
    const params = [];

    // Date range filter (UTC)
    if (startDate) {
      sql += ' AND time_when_added >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND time_when_added <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY time_when_added DESC';

    const result = await db.execute(sql, params);
    const rows = result.rows;
    res.json(rows.map(rowToApi));
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;