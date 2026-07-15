const admin = require('../config/firebase');
const pool = require('../config/db');

/**
 * Verifies the Firebase ID token sent in the Authorization header
 * (Bearer <token>), then loads/creates the matching PostgreSQL user row
 * and attaches it to req.user.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decoded;

    // Find existing user, or auto-create on first login
    let result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (firebase_uid, name, email, avatar_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [uid, name || email.split('@')[0], email, picture || null]
      );
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
