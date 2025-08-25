// =============================================================
// **NEW FILE**
// File: routes/adminRoutes.js
// Admin se related routes ko define karta hai.
// Isse 'routes' folder mein save karein.
// =============================================================
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAdminApplications } from '../controllers/adminController.js';

const router_admin = express.Router();

// Admin dashboard ke liye route
router_admin.get('/applications', protect, getAdminApplications);

export default router_admin;
