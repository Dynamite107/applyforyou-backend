// =============================================================
// File: routes/authRoutes.js
// Is code ko 'routes' folder ke andar 'authRoutes.js' naam se save karein.
// =============================================================
import express from 'express';
import { registerUser } from '../controllers/authController.js';

const router = express.Router();

// Jab frontend se /api/auth/register par POST request aayegi,
// to registerUser function chalega.
router.post('/register', registerUser);

export default router;

