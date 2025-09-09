import express from 'express';
// **YAHAN BADLAV KIYA GAYA HAI**
// Ab hum naye admin wale guard ka istemal karenge
import { adminProtect } from '../middleware/adminAuthMiddleware.js'; 
import { getAdminApplications, adminLogin } from '../controllers/adminController.js';

const router_admin = express.Router();

// Admin dashboard ke liye route, ab naye guard se surakshit hai
router_admin.get('/applications', adminProtect, getAdminApplications);

// Admin login ke liye route
router_admin.post('/login', adminLogin);

export default router_admin;
