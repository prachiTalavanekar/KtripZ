const getFirebaseAdmin = require('../config/firebase');

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    const admin = getFirebaseAdmin();
    await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
  } catch (err) {
    console.error('FCM error:', err.message);
  }
};

const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  const validTokens = tokens.filter(Boolean);
  if (!validTokens.length) return;
  try {
    const admin = getFirebaseAdmin();
    await admin.messaging().sendEachForMulticast({ tokens: validTokens, notification: { title, body }, data });
  } catch (err) {
    console.error('FCM multicast error:', err.message);
  }
};

module.exports = { sendPushNotification, sendMulticastNotification };
