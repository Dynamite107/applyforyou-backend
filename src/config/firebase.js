// =============================================================
// File: src/config/firebase.js (UPDATED)
// Firebase Client aur Admin SDK dono ko initialize karein
// =============================================================
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// CLIENT-SIDE SDK CONFIG (Browser ke liye)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY, // Inhe bhi environment variables me daalein
    authDomain: "apply4you-6445b.firebaseapp.com",
    projectId: "apply4you-6445b",
    storageBucket: "apply4you-6445b.firebasestorage.app",
    messagingSenderId: "540629874339",
    appId: "1:540629874339:web:008c941fd446ca6a407116"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ADMIN SDK CONFIG (Server ke liye)
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.message);
}


const db = admin.firestore();

// Dono ko export karein
export { admin, db };
