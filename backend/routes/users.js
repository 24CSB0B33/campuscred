const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// GET /api/users/me - current logged-in user's profile (auto-created by authMiddleware)
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/me - update bio/name
router.put('/me', auth, async (req, res) => {
  const { name, bio } = req.body;
  const result = await pool.query(
    `UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio) WHERE id = $3 RETURNING *`,
    [name, bio, req.user.id]
  );
  res.json(result.rows[0]);
});

// GET /api/users/me/transactions - credit history
router.get('/me/transactions', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

module.exports = router;
