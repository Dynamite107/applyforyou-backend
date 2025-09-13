// =============================================================
// File: src/config/firebase.js (CORRECTED FOR RENDER SECRET FILE)
// =============================================================
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Render par secret file ka path hamesha /etc/secrets/FILENAME hota hai
const SERVICE_ACCOUNT_PATH = '/etc/secrets/firebase-credentials.json';

try {
    // File se service account key ko padhein
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    // Check karein ki app pehle se initialize to nahi hai
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK safaltapoorvak initialize ho gaya.');
    }
} catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // Is error ka matlab hai ki server ko secret file nahi mil rahi ya usme galti hai.
}

// Admin SDK se firestore instance banayein
const db = admin.firestore();

// Admin object aur db ko export karein
export { admin, db };
