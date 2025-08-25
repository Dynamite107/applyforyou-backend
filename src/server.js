// =============================================================
// File: src/server.js
// Express server aur routes ko configure karein.
// =============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/firebase.js'; 

// Apne banaye gaye routes ko import karein
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js'; 
import adminRoutes from './routes/adminRoutes.js'; // NEW: Admin routes ko import karein

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

// Routes ko app se jod dein
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes); // NEW: Admin routes ko add karein

// Server ko start karein
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} par chal raha hai`);
});
