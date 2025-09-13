import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
    // Service account key ko environment variable se parse karein
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Check karein ki app pehle se initialize to nahi hai
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK safaltapoorvak initialize ho gaya.');
    }
} catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.message);
}

// Admin SDK se firestore instance banayein
const db = admin.firestore();

// Admin object aur db ko export karein
export { admin, db };
