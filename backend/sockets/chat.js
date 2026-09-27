const pool = require('../config/db');
const admin = require('../config/firebase');

// Live chat for a booked session. Messages are saved and sent to everyone in that session.
function initChat(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = await admin.auth().verifyIdToken(token);
      const userRes = await pool.query('SELECT id, name FROM users WHERE firebase_uid = $1', [decoded.uid]);
      if (userRes.rows.length === 0) return next(new Error('User not found'));
      socket.user = userRes.rows[0];
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_session', (sessionId) => {
      socket.join(`session_${sessionId}`);
    });

    socket.on('send_message', async ({ sessionId, content }) => {
      try {
        const result = await pool.query(
          `INSERT INTO messages (session_id, sender_id, content)
           VALUES ($1, $2, $3) RETURNING *`,
          [sessionId, socket.user.id, content]
        );
        const message = { ...result.rows[0], sender_name: socket.user.name };
        io.to(`session_${sessionId}`).emit('new_message', message);
      } catch (err) {
        socket.emit('error_message', 'Message failed to send');
      }
    });

    socket.on('disconnect', () => {
      // Socket.io leaves room when someone disconnects
    });
  });
}

module.exports = initChat;
