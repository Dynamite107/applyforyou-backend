// =============================================================
// File: src/config/firebase.js
// Final and Corrected Version
// =============================================================
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
  // Firebase Admin SDK apne aap Render ke Secret File se credentials le lega.
  // Aapko JSON.parse karne ki zaroorat nahi hai.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  
  console.log("Firebase Admin SDK safaltapoorvak initialize ho gaya.");

} catch (error) {
  console.error("Firebase Admin SDK initialize karne mein error:", error.message);
  console.error("Kripya check karein ki aapne Render par Secret File theek se banayi hai.");
  process.exit(1);
}

export const db = admin.firestore();
export const auth = admin.auth();
