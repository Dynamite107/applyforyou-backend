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
import adminRoutes from './routes/adminRoutes.js';

// .env file se secret keys load karne ke liye configuration
dotenv.config();

// Express application banayein
const app = express();
const PORT = process.env.PORT || 5000;

// === YAHAN BADLAV KIYA GAYA HAI ===
// Un sabhi websites ki list banayein jinhe aap allow karna chahte hain
const allowedOrigins = [
  'https://applyforyou.netlify.app', // Purana Netlify domain
  'https://www.applyforyou.in',      // Naya www domain
  'https://applyforyou.in'           // Naya non-www domain
];

// CORS ko configure karein taki wo list me se kisi bhi origin ko allow kar sake
const corsOptions = {
  origin: function (origin, callback) {
    // Agar request list me se kisi origin se aayi hai (ya server se hi aayi hai)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// ===================================

// Middlewares ka istemal karein
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
app.use('/api/admin', adminRoutes);

// Server ko start karein
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} par chal raha hai`);
});
