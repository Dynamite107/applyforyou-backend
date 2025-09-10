// File: routes/paymentRoutes.js
// Is code ko 'routes' folder ke andar 'paymentRoutes.js' naam se save karein.
// =============================================================
import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router_payment = express.Router();

// /api/payment/create-order par request aane par createOrder function chalega.
// 'protect' middleware yeh sunishchit karta hai ki user pehle se login ho.
router_payment.post('/create-razorpay-order', protect, createOrder);

// /api/payment/verify par request aane par verifyPayment function chalega.
router_payment.post('/verify-razorpay', protect, verifyPayment);

export default router_payment;
