# CampusCred — Peer-to-Peer Skill Exchange Platform

A platform where users trade skills using **credits** instead of money.
Learn guitar by teaching Python. No cash exchanges — only knowledge.

## Architecture 
```
campuscred/
├── backend/
│   ├── config/          → db.js (PostgreSQL pool), firebase.js (Admin SDK init)
│   ├── middleware/       → authMiddleware.js (verifies Firebase token → loads/creates PG user)
│   ├── services/         → matching.js (the core weighted matching algorithm)
│   ├── routes/           → skills.js, match.js, sessions.js, reviews.js, users.js
│   ├── sockets/          → chat.js (Socket.io real-time messaging)
│   ├── schema.sql        → full PostgreSQL schema
│   └── server.js         → Express app entry point
└── frontend/
    └── src/
        ├── config/firebase.js   → Firebase client SDK setup
        ├── api/client.js        → Axios instance, auto-attaches Firebase ID token
        ├── redux/                → walletSlice.js (credit balance state), store.js
        ├── pages/FindMatch.jsx   → skill search + matching results UI
        └── components/SessionChat.jsx → real-time chat widget
        
1. **Auth**: Firebase handles sign-in on the frontend. Every API call sends the Firebase ID token; `authMiddleware.js` verifies it server-side and auto-provisions a matching row in the PostgreSQL `users` table on first login. Postgres never stores passwords — Firebase owns identity, Postgres owns app data.

2. **Matching algorithm** (`services/matching.js`): the differentiator of this project. When a learner searches for a skill, it scores every teacher of that skill using three weighted signals:
   - **Rating (40%)** — teacher's historical average rating
   - **Availability overlap (35%)** — compares the teacher's weekly slots against the learner's preferred day/time
   - **Current load (25%)** — teachers with fewer pending/confirmed sessions score higher (spreads bookings evenly instead of everyone flooding the top-rated teacher)

3. **Credit economy**: booking a session immediately escrows credits from the learner (`sessions.js`). Credits only release to the teacher when the session is marked `completed`; cancellations auto-refund the learner. All movement is logged in `transactions` for a full audit trail.

4. **Real-time chat**: Socket.io rooms are scoped per `sessionId`. Messages are persisted to Postgres so chat history survives reconnects.
```

## Tech Stack
- **Frontend**: React.js, Redux Toolkit, Tailwind CSS, Socket.io-client
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Auth**: Firebase Authentication (Admin SDK verification server-side)
- **Real-time**: Socket.io
