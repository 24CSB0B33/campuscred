const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// POST /api/reviews - leave a review after a completed session
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { sessionId, revieweeId, rating, comment } = req.body;

    await client.query('BEGIN');

    const review = await client.query(
      `INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionId, req.user.id, revieweeId, rating, comment || null]
    );

    // Recalculate the reviewee's rolling average rating
    const agg = await client.query(
      `SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as count
       FROM reviews WHERE reviewee_id = $1`,
      [revieweeId]
    );

    await client.query('UPDATE users SET rating_avg = $1, rating_count = $2 WHERE id = $3', [
      agg.rows[0].avg,
      agg.rows[0].count,
      revieweeId,
    ]);

    await client.query('COMMIT');
    res.status(201).json(review.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Review submission failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
