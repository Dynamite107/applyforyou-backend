// =============================================================
// **NEW FILE**
// File: routes/userRoutes.js
// User se related routes ko define karta hai.
// Isse 'routes' folder mein save karein.
// =============================================================
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getFormHistory } from '../controllers/userController.js';

const router_user = express.Router();

// User ki form history fetch karne ke liye route
router_user.get('/form-history', protect, getFormHistory);

export default router_user;
