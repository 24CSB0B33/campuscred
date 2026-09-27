const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Book a session. Credits come off the learner now and go to the teacher later, once it's done.
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { teacherId, skillId, scheduledAt, durationMinutes, creditsCost } = req.body;
    const cost = creditsCost || 1;
    const learnerId = req.user.id;

    await client.query('BEGIN');

    const learnerRes = await client.query('SELECT credits FROM users WHERE id = $1 FOR UPDATE', [learnerId]);
    if (learnerRes.rows[0].credits < cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough credits' });
    }

    // Hold the credits until the session is finished
    await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [cost, learnerId]);

    const sessionRes = await client.query(
      `INSERT INTO sessions (teacher_id, learner_id, skill_id, scheduled_at, duration_minutes, credits_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [teacherId, learnerId, skillId, scheduledAt, durationMinutes || 60, cost]
    );
    const session = sessionRes.rows[0];

    await client.query(
      `INSERT INTO transactions (user_id, session_id, amount, type, note)
       VALUES ($1, $2, $3, 'debit', 'Escrow hold for booked session')`,
      [learnerId, session.id, -cost]
    );

    await client.query('COMMIT');
    res.status(201).json(session);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
});

// Confirm, finish, or cancel a session
router.put('/:id/status', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status } = req.body; // confirmed, completed, or cancelled
    const sessionId = req.params.id;

    await client.query('BEGIN');
    const sRes = await client.query('SELECT * FROM sessions WHERE id = $1 FOR UPDATE', [sessionId]);
    const session = sRes.rows[0];
    if (!session) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Session not found' });
    }

    await client.query('UPDATE sessions SET status = $1 WHERE id = $2', [status, sessionId]);

    if (status === 'completed') {
      // Session is done — pay the teacher
      await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [
        session.credits_cost,
        session.teacher_id,
      ]);
      await client.query(
        `INSERT INTO transactions (user_id, session_id, amount, type, note)
         VALUES ($1, $2, $3, 'credit', 'Payout for completed session')`,
        [session.teacher_id, sessionId, session.credits_cost]
      );
    }

    if (status === 'cancelled') {
      // Session was cancelled — give the credits back
      await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [
        session.credits_cost,
        session.learner_id,
      ]);
      await client.query(
        `INSERT INTO transactions (user_id, session_id, amount, type, note)
         VALUES ($1, $2, $3, 'credit', 'Refund for cancelled session')`,
        [session.learner_id, sessionId, session.credits_cost]
      );
    }

    await client.query('COMMIT');
    res.json({ message: `Session marked as ${status}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Status update failed' });
  } finally {
    client.release();
  }
});

// All of this user's sessions, whether they are teaching or learning
router.get('/mine', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.*, sk.name as skill_name,
            t.name as teacher_name, l.name as learner_name
     FROM sessions s
     JOIN skills sk ON sk.id = s.skill_id
     JOIN users t ON t.id = s.teacher_id
     JOIN users l ON l.id = s.learner_id
     WHERE s.teacher_id = $1 OR s.learner_id = $1
     ORDER BY s.scheduled_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

module.exports = router;
