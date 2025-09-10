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
    // === Naya helper function 24-ghante ke format ko AM/PM me badalne ke liye ===
    const formatTo12Hour = (hour) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        let hour12 = hour % 12;
        hour12 = hour12 ? hour12 : 12; // 0 baje (midnight) ko 12 AM aur 12 baje (noon) ko 12 PM dikhayein
        return `${hour12}:00 ${ampm}`;
    };

    const now = new Date();
    const indiaTimeOffset = 5.5 * 60 * 60 * 1000;
    let currentTime = new Date(now.getTime() + indiaTimeOffset);
    const bookingStartTime = 7;
    const bookingEndTime = 15;
    const slotCapacity = 4; // आप इसे अपनी ज़रूरत के अनुसार बदल सकते हैं
    let searchDate = new Date(currentTime);
    searchDate.setUTCHours(0, 0, 0, 0);
    let nextDay = new Date(searchDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
        let currentDay = dayOffset === 0 ? searchDate : nextDay;
        let startHour = bookingStartTime;

        if (dayOffset === 0 && currentTime.getUTCHours() >= bookingStartTime) {
            startHour = currentTime.getUTCHours() + 1;
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
                
                // ** YAHAN BADLAV KIYA GAYA HAI **
                // Naye helper function ka istemal karke AM/PM jodein
                const startTime12hr = formatTo12Hour(hour);
                const endTime12hr = formatTo12Hour(hour + 1);

                return {
                    timeSlot: `${day}, ${startTime12hr} - ${endTime12hr}`,
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
    // createOrder में अब स्लॉट चेक करने की ज़रूरत नहीं, क्योंकि यह verifyPayment में होता है।
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Amount sahi nahi hai.' });
        }
        const options = {
            amount: Math.round(amount),
            currency: 'INR',
            receipt: `receipt_order_${new Date().getTime()}`,
        };
        const order = await razorpay.orders.create(options);
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
            
            // पेमेंट सफल होने के बाद ही स्लॉट चेक और जेनरेट करें
            const tokenId = await generateNextTokenId();
            const slotDetails = await findNextAvailableSlot();

            const newApplication = {
                userId,
                customerName: customerName,
                whatsappNo: whatsappNo,
                service: service.title,
                amount: Number(amount),
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                status: 'Processing',
                createdAt: new Date(),
                paymentGateway: 'Razorpay',
                tokenId: tokenId,
                timeSlot: slotDetails ? slotDetails.timeSlot : null,
                slotAssignedAt: slotDetails ? slotDetails.slotAssignedAt : null
            };
            
            await db.collection('payments').add(newApplication);
            await saveApplicationDataToSheet(newApplication);
            
            // **सही फॉर्मेट में सारी जानकारी फ्रंटएंड को भेजें**
            res.status(201).json({ 
                success: true,
                message: 'Payment safal!', 
                applicationData: newApplication
            });
        } catch (error) {
            console.error('Error saving application:', error);
            res.status(500).json({ message: 'Application save karne me asamarth.' });
        }
    } else {
        res.status(400).json({ success: false, message: 'Payment verification fail ho gayi. Invalid signature.' });
    }
};
