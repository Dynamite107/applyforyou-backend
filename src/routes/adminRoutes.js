// File: src/routes/adminRoutes.js (Updated)
import express from 'express';
import { adminProtect } from '../middleware/adminAuthMiddleware.js'; 
import { getAdminApplications, adminLogin, updateApplicationStatus } from '../controllers/adminController.js';

const router_admin = express.Router();

// Sabhi applications laane ke liye route
router_admin.get('/applications', adminProtect, getAdminApplications);

// ** YEH NAYA ROUTE JODA GAYA HAI **
// Status update karne ke liye route
router_admin.put('/applications/:id/status', adminProtect, updateApplicationStatus);

// Admin login ke liye route
router_admin.post('/login', adminLogin);

export default router_admin;
