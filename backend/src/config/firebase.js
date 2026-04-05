const admin = require('firebase-admin');

let initialized = false;

const getFirebaseAdmin = () => {
  if (!initialized && !admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      initialized = true;
    } catch (err) {
      console.warn('Firebase not initialized (check credentials):', err.message);
    }
  }
  return admin;
};

module.exports = getFirebaseAdmin;
