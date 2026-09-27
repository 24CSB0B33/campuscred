const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// List every skill (used in search and dropdowns)
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM skills ORDER BY name');
  res.json(result.rows);
});

// Add a skill. If it already exists, just update the category.
router.post('/', auth, async (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Skill name required' });

  const result = await pool.query(
    `INSERT INTO skills (name, category) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
     RETURNING *`,
    [name, category || null]
  );
  res.status(201).json(result.rows[0]);
});

// Mark a skill as something you can teach or want to learn
router.post('/tag', auth, async (req, res) => {
  const { skillId, type, proficiency } = req.body; // teach or learn
  if (!['teach', 'learn'].includes(type)) {
    return res.status(400).json({ error: "type must be 'teach' or 'learn'" });
  }

  const result = await pool.query(
    `INSERT INTO user_skills (user_id, skill_id, type, proficiency)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, skill_id, type) DO UPDATE SET proficiency = EXCLUDED.proficiency
     RETURNING *`,
    [req.user.id, skillId, type, proficiency || 'intermediate']
  );
  res.status(201).json(result.rows[0]);
});

// Save a weekly time slot when this user can teach
router.post('/availability', auth, async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;
  const result = await pool.query(
    `INSERT INTO user_availability (user_id, day_of_week, start_time, end_time)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, dayOfWeek, startTime, endTime]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
