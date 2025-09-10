import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { saveApplicationDataToSheet } from '../helpers/googleSheetHelper.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// === HELPER FUNCTIONS ===
async function findNextAvailableSlot() {
    const now = new Date();
    const indiaTimeOffset = 5.5 * 60 * 60 * 1000; // IST offset
    let currentTime = new Date(now.getTime() + indiaTimeOffset);
    const bookingStartTime = 7;
    const bookingEndTime = 15;
    const slotCapacity = 4;
    let searchDate = new Date(currentTime);
    searchDate.setUTCHours(0, 0, 0, 0);
    let nextDay = new Date(searchDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
        let currentDay = dayOffset === 0 ? searchDate : nextDay;
        let startHour = bookingStartTime;
        if (dayOffset === 0 && currentTime.getUTCHours() >= bookingStartTime) {
            startHour = currentTime.getUTCHours();
        }
        for (let hour = startHour; hour < bookingEndTime; hour++) {
            const slotStart = new Date(currentDay);
            slotStart.setUTCHours(hour, 0, 0, 0);
            const slotEnd = new Date(currentDay);
            slotEnd.setUTCHours(hour, 59, 59, 999);
            const query = db.collection('payments')
                .where('slotAssignedAt', '>=', slotStart)
                .where('slotAssignedAt', '<=', slotEnd);
            const snapshot = await query.get();
            const count = snapshot.size;
            if (count < slotCapacity) {
                const assignedTime = new Date(currentDay);
                assignedTime.setUTCHours(hour);
                const day = assignedTime.toLocaleDateString('en-IN');
                return {
                    timeSlot: `${day}, ${hour}:00 - ${hour + 1}:00`,
                    slotAssignedAt: assignedTime
                };
            }
        }
    }
    return null;
}

async function generateNextTokenId() {
    const now = new Date();
    const indiaTimeOffset = 5.5 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + indiaTimeOffset);
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const query = db.collection('payments').where('createdAt', '>=', startOfDay).where('createdAt', '<=', endOfDay);
    const snapshot = await query.get();
    const todayCount = snapshot.size;
    const serialNumber = todayCount + 1;
    const date = today.getUTCDate().toString().padStart(2, '0');
    const year = today.getUTCFullYear().toString().slice(-2);
    return `${serialNumber}${date}${year}`;
}

// === CONTROLLER FUNCTIONS (FINAL VERSION) ===

export const createOrder = async (req, res) => {
    const availableSlot = await findNextAvailableSlot();
    if (!availableSlot) {
        return res.status(429).json({ message: 'Time slot 24 hr ke liye full hai kripya aap kal aawedn kre' });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount sahi nahi hai.'});
    }

    // ध्यान दें: फ्रंटएंड से अमाउंट पहले से ही पैसे में आ रहा है (amount * 100)
    // इसलिए यहाँ दोबारा गुणा नहीं करेंगे।
    const options = {
        amount: Math.round(amount),
        currency: 'INR',
        receipt: `receipt_order_${new Date().getTime()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        
        // ** YAHI ASLI FIX HAI **
        // फ्रंटएंड को 'orderId' नाम से order.id और keyId भेजें
        res.status(200).json({
            orderId: order.id,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Order banane me asamarth.' });
    }
};

export const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationDetails } = req.body;
    
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
        try {
            const { service, amount, whatsappNo } = applicationDetails;
            const userId = req.user.uid;
            const customerName = req.user.name || req.user.email;
            
            const tokenId = await generateNextTokenId();
            const slotDetails = await findNextAvailableSlot();

            if (!slotDetails) {
                return res.status(429).json({ success: false, message: 'Payment ke dauran slot full ho gaya. Kripya baad me koshish karein.' });
            }

            const newApplication = {
                userId,
                service: service.title,
                amount: Number(amount),
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                status: 'Processing',
                createdAt: new Date(),
                customerName: customerName,
                whatsappNo: whatsappNo,
                paymentGateway: 'Razorpay',
                tokenId: tokenId,
                timeSlot: slotDetails.timeSlot,
                slotAssignedAt: slotDetails.slotAssignedAt
            };
            
            await db.collection('payments').add(newApplication);
            await saveApplicationDataToSheet(newApplication);

            // ** दूसरा बदलाव: सफलता वाले पेज के लिए सारी जानकारी भेजें **
            res.status(201).json({ 
                success: true,
                message: 'Payment safal! Aapka application submit ho gaya hai.', 
                applicationDetails: {
                    tokenId: newApplication.tokenId,
                    timeSlot: newApplication.timeSlot,
                    service: newApplication.service,
                    createdAt: newApplication.createdAt
                }
            });
        } catch (error) {
            console.error('Error saving application:', error);
            res.status(500).json({ message: 'Application save karne me asamarth.' });
        }
    } else {
        res.status(400).json({ success: false, message: 'Payment verification fail ho gayi. Invalid signature.' });
    }
};
