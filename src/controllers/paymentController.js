// =============================================================
// File: server/controllers/paymentController.js
// (Ismein badlav kiya gaya hai)
// =============================================================
import Razorpay from 'razorpay';
import crypto from 'crypto';
// **FIX:** Firebase import ka tarika badla gaya
import admin from 'firebase-admin';
import { saveApplicationDataToDrive } from '../helpers/googleDriveHelper.js';

const db_payment = admin.firestore();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount sahi nahi hai.'});
  }

  const options = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Order banane me asamarth.' });
  }
};

export const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationDetails } = req.body;
    const { userId, service, amount, customerDetails } = applicationDetails;
    
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
        try {
            const newApplication = {
                userId,
                serviceTitle: service.title,
                serviceId: service.id,
                amountPaid: amount,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                status: 'Received',
                appliedAt: new Date(),
                customerName: customerDetails.name,
                customerEmail: customerDetails.email
            };

            const docRef = await db_payment.collection('applications').add(newApplication);

            saveApplicationDataToDrive(newApplication);

            res.status(201).json({ message: 'Payment safal! Aapka application submit ho gaya hai.', applicationId: docRef.id });
        } catch (error) {
            console.error('Error saving application:', error);
            res.status(500).json({ message: 'Application save karne me asamarth.' });
        }
    } else {
        res.status(400).json({ message: 'Payment verification fail ho gayi. Invalid signature.' });
    }
};
