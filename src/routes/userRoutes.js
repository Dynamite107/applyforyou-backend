// File: src/routes/userRoutes.js (Updated)
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getApplicationHistory } from '../controllers/userController.js';

const router = express.Router();

// User ki application history fetch karne ke liye route
router.get('/applications', protect, getApplicationHistory);

export default router;
