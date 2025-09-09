// =============================================================
// File: src/routes/userRoutes.js
// User se related routes ko define karta hai.
// =============================================================
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getFormHistory } from '../controllers/userController.js';

const router = express.Router();

// User ki form history fetch karne ke liye route
// Yeh route ab 'protect' middleware se surakshit hai
router.get('/form-history', protect, getFormHistory);

export default router;

