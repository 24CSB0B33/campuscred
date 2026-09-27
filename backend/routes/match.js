const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { findMatches } = require('../services/matching');

// Find teachers for a skill, optionally around a day and time
router.get('/', auth, async (req, res) => {
  try {
    const { skillId, day, start, end } = req.query;
    if (!skillId) return res.status(400).json({ error: 'skillId is required' });

    const matches = await findMatches({
      learnerId: req.user.id,
      skillId: parseInt(skillId),
      preferredDay: day !== undefined ? parseInt(day) : undefined,
      preferredStart: start,
      preferredEnd: end,
    });

    res.json({ count: matches.length, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Matching failed' });
  }
});

module.exports = router;
