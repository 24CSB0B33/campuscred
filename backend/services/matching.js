const pool = require('../config/db');

/**
 * Custom weighted matching algorithm.
 *
 * Given a learner and a skill they want to learn, this scores every
 * candidate teacher of that skill using three signals:
 *
 *   1. Rating score   (40%) - teacher's average rating, normalized 0-1
 *   2. Availability    (35%) - overlap between teacher's weekly slots
 *                              and the learner's requested day/time window
 *   3. Experience/load (25%) - fewer pending sessions = more available
 *                              bandwidth right now (inverse load score)
 *
 * Returns candidates sorted by score, highest first.
 */
async function findMatches({ learnerId, skillId, preferredDay, preferredStart, preferredEnd }) {
  // 1. Get all teachers who teach this skill (excluding the learner themself)
  const teachersRes = await pool.query(
    `SELECT u.id, u.name, u.rating_avg, u.rating_count, u.credits
     FROM user_skills us
     JOIN users u ON u.id = us.user_id
     WHERE us.skill_id = $1 AND us.type = 'teach' AND u.id != $2`,
    [skillId, learnerId]
  );

  const teachers = teachersRes.rows;
  if (teachers.length === 0) return [];

  const teacherIds = teachers.map((t) => t.id);

  // 2. Get availability slots for all candidate teachers in one query
  const availRes = await pool.query(
    `SELECT * FROM user_availability WHERE user_id = ANY($1::int[])`,
    [teacherIds]
  );

  // 3. Get each teacher's current pending/confirmed session load
  const loadRes = await pool.query(
    `SELECT teacher_id, COUNT(*) as active_sessions
     FROM sessions
     WHERE teacher_id = ANY($1::int[]) AND status IN ('pending','confirmed')
     GROUP BY teacher_id`,
    [teacherIds]
  );
  const loadMap = Object.fromEntries(loadRes.rows.map((r) => [r.teacher_id, parseInt(r.active_sessions)]));

  const maxLoad = Math.max(1, ...Object.values(loadMap), 1);

  const scored = teachers.map((teacher) => {
    // --- Rating score (0-1) ---
    const ratingScore = teacher.rating_count > 0 ? teacher.rating_avg / 5 : 0.5; // neutral default for new teachers

    // --- Availability score (0-1) ---
    const slots = availRes.rows.filter((s) => s.user_id === teacher.id);
    let availabilityScore = 0.3; // baseline if learner gave no time preference
    if (preferredDay !== undefined && preferredStart && preferredEnd) {
      const overlapping = slots.some(
        (s) =>
          s.day_of_week === preferredDay &&
          s.start_time <= preferredEnd &&
          s.end_time >= preferredStart
      );
      availabilityScore = overlapping ? 1 : slots.length > 0 ? 0.2 : 0;
    }

    // --- Load score (0-1), inverse of how busy they currently are ---
    const currentLoad = loadMap[teacher.id] || 0;
    const loadScore = 1 - currentLoad / maxLoad;

    const finalScore =
      ratingScore * 0.4 + availabilityScore * 0.35 + loadScore * 0.25;

    return {
      teacherId: teacher.id,
      name: teacher.name,
      rating: teacher.rating_avg,
      ratingCount: teacher.rating_count,
      activeSessions: currentLoad,
      score: Number(finalScore.toFixed(3)),
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

module.exports = { findMatches };
