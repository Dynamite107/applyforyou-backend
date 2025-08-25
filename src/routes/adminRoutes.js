import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAdminApplications, adminLogin } from '../controllers/adminController.js';

const router_admin = express.Router();

// Admin dashboard ke liye route
router_admin.get('/applications', protect, getAdminApplications);

// Admin login ke liye route
router_admin.post('/login', adminLogin);

export default router_admin;
