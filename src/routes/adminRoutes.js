 =============================================================
 File routesadminRoutes.js
 Admin se related routes ko define karta hai.
 Isse 'routes' folder mein save karein.
 =============================================================
import express from 'express';
import { protect } from '..middlewareauthMiddleware.js';
import { getAdminApplications, adminLogin } from '..controllersadminController.js';  NEW adminLogin import karein

const router_admin = express.Router();

 Admin dashboard ke liye route
router_admin.get('applications', protect, getAdminApplications);

 NEW Admin login ke liye route
router_admin.post('login', adminLogin);

export default router_admin;
