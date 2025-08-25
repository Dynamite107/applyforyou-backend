// =============================================================
// File: src/controllers/paymentController.js
// Yeh file payment order aur verification ko handle karti hai.
// =============================================================
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { saveApplicationDataToDrive } from '../helpers/googleDriveHelper.js';

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
            // Generate a random token ID and delivery date
            const tokenId = `AP-TXN-${Math.floor(Math.random() * 100000)}`;
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 din baad delivery date set karein

            const newApplication = {
                userId,
                serviceTitle: service.title,
                serviceId: service.id,
                amountPaid: amount,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                status: 'Processing',
                appliedAt: new Date(),
                customerName: customerDetails.name,
                customerEmail: customerDetails.email,
                tokenId: tokenId,
                deliveryDate: deliveryDate.toISOString().split('T')[0] // Format: YYYY-MM-DD
            };
            
            // Firestore mein application save karein
            const docRef = await db.collection('applications').add(newApplication);

            // Google Drive mein application data save karein
            saveApplicationDataToDrive({ 
                ...newApplication, 
                customerName: customerDetails.name,
                customerEmail: customerDetails.email,
                timeSlot: 'Morning (10 AM - 1 PM)' // Example time slot
            });

            // Frontend ko response dein
            res.status(201).json({ 
                message: 'Payment safal! Aapka application submit ho gaya hai.', 
                applicationId: docRef.id,
                transactionDetails: {
                    customerName: customerDetails.name,
                    serviceName: service.title,
                    tokenId: tokenId,
                    timeSlot: 'Morning (10 AM - 1 PM)', // Example time slot
                    appliedDate: newApplication.appliedAt.toISOString().split('T')[0],
                    deliveryDate: newApplication.deliveryDate
                }
            });
        } catch (error) {
            console.error('Error saving application:', error);
            res.status(500).json({ message: 'Application save karne me asamarth.' });
        }
    } else {
        res.status(400).json({ message: 'Payment verification fail ho gayi. Invalid signature.' });
    }
};
