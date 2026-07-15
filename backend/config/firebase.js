// Initializes Firebase Admin SDK for verifying ID tokens sent from the React frontend
const admin = require('firebase-admin');
require('dotenv').config();

// Service account key stored as an env var (stringified JSON) — never commit the raw file
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
