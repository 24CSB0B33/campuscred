// Used on the server to check that a user's login token is real
const admin = require('firebase-admin');
require('dotenv').config();

// Keep the Firebase key in .env, not in the repo
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
