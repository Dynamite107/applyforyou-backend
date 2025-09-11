// File: routes/paymentRoutes.js (Updated)
// =============================================================
import express from 'express';
import { 
    createOrder, 
    verifyPayment,
    // ** Naye functions ko import karein **
    initiatePhonePePayment, 
    verifyPhonePePayment 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router_payment = express.Router();

// --- RAZORPAY ROUTES ---
router_payment.post('/create-razorpay-order', protect, createOrder);
router_payment.post('/verify-razorpay', protect, verifyPayment);


// --- PHONEPE ROUTES (Yeh do nayi lines jodi gayi hain) ---
router_payment.post('/initiate-phonepe', protect, initiatePhonePePayment);
router_payment.get('/verify-phonepe-payment/:transactionId', protect, verifyPhonePePayment);


export default router_payment;
