// =============================================================
// File: src/server.js
// (Ismein badlav kiya gaya hai)
// =============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// **FIX:** Firebase initialization ko alag file se import karein
import './config/firebase.js'; 

// Apne banaye gaye routes ko import karein
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// .env file se secret keys load karne ke liye configuration
dotenv.config();

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
