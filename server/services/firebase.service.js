const admin = require('firebase-admin');

let isInitialized = false;

const initializeFirebase = () => {
  if (isInitialized) {
    return;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase credentials not configured. Phone OTP will use fallback mode.');
    return;
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  isInitialized = true;
  console.log('Firebase Admin SDK initialized');
};

const verifyPhoneNumber = async (idToken) => {
  initializeFirebase();

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      valid: true,
      phoneNumber: decodedToken.phone_number,
      uid: decodedToken.uid,
    };
  } catch (error) {
    console.error('Firebase phone verification error:', error);
    return {
      valid: false,
      error: error.message,
    };
  }
};

const sendOtpViaFirebase = async (phoneNumber) => {
  initializeFirebase();

  try {
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return {
      exists: true,
      uid: user.uid,
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return {
        exists: false,
        message: 'User not found. Please register first.',
      };
    }
    throw error;
  }
};

const createCustomToken = async (phoneNumber, additionalClaims = {}) => {
  initializeFirebase();

  try {
    let user;
    try {
      user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    } catch {
      user = await admin.auth().createUser({
        phoneNumber: phoneNumber,
      });
    }

    const customToken = await admin.auth().createCustomToken(user.uid, additionalClaims);
    return {
      success: true,
      token: customToken,
      uid: user.uid,
    };
  } catch (error) {
    console.error('Firebase custom token error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

initializeFirebase();

module.exports = {
  verifyPhoneNumber,
  sendOtpViaFirebase,
  createCustomToken,
  initializeFirebase,
};
