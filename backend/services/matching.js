const pool = require('../config/db');

// Finds teachers for a skill and ranks them. Rating counts most, then whether
// their free time matches, then how busy they already are.
async function findMatches({ learnerId, skillId, preferredDay, preferredStart, preferredEnd }) {
  // Teachers of this skill, not including the person searching
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

  // When each teacher is free
  const availRes = await pool.query(
    `SELECT * FROM user_availability WHERE user_id = ANY($1::int[])`,
    [teacherIds]
  );

  // How many sessions each teacher already has lined up
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
    // New teachers get a middle rating so they aren't stuck at the bottom
    const ratingScore = teacher.rating_count > 0 ? teacher.rating_avg / 5 : 0.5;

    const slots = availRes.rows.filter((s) => s.user_id === teacher.id);
    // If the learner didn't pick a time, give a small default score
    let availabilityScore = 0.3;
    if (preferredDay !== undefined && preferredStart && preferredEnd) {
      const overlapping = slots.some(
        (s) =>
          s.day_of_week === preferredDay &&
          s.start_time <= preferredEnd &&
          s.end_time >= preferredStart
      );
      availabilityScore = overlapping ? 1 : slots.length > 0 ? 0.2 : 0;
    }

    // Busier teachers score a bit lower so bookings spread out
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
