// =============================================================
// **NEW FILE**
// File: src/config/firebase.js
// Yeh ek nayi file hai. Isse 'src' ke andar 'config' naam ka folder banakar save karein.
// =============================================================
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin SDK safaltapoorvak initialize ho gaya.");
} catch (error) {
  console.error("Firebase Admin SDK initialize karne mein error:", error.message);
  process.exit(1);
}

export const db = admin.firestore();
export const auth = admin.auth();
