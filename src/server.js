// File: server/server.js
// (Ismein badlav kiya gaya hai)
// =============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// **FIX:** Firebase import ka tarika badla gaya
import admin from 'firebase-admin';

// Apne banaye gaye routes ko import karein
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// .env file se secret keys load karne ke liye configuration
dotenv.config();

// Firebase Admin SDK ko initialize (shuru) karein
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  // **FIX:** credential() ko admin.credential.cert() se access karein
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin SDK safaltapoorvak initialize ho gaya.");
} catch (error) {
  console.error("Firebase Admin SDK initialize karne mein error:", error.message);
  console.log("Kripya check karein ki .env file mein FIREBASE_SERVICE_ACCOUNT sahi JSON string hai.");
  process.exit(1);
}

// Express application banayein
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares ka istemal karein
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/', (req, res) => {
  res.send('Applyforyou API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Server ko start karein
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} par chal raha hai`);
});
