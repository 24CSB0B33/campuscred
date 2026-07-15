const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const skillsRoutes = require('./routes/skills');
const matchRoutes = require('./routes/match');
const sessionRoutes = require('./routes/sessions');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const initChat = require('./sockets/chat');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/skills', skillsRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
initChat(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`CampusCred API running on port ${PORT}`));
