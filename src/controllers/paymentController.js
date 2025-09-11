import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../config/firebase.js';
import { saveApplicationDataToSheet } from '../helpers/googleSheetHelper.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// === HELPER FUNCTIONS ===
async function findNextAvailableSlot() {
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

// === RAZORPAY CONTROLLER FUNCTIONS ===
export const createOrder = async (req, res) => {
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

// =============================================================
// == PHONEPE INTEGRATION CODE START ==
// =============================================================
export const initiatePhonePePayment = async (req, res) => {
    try {
        const { amount, service, whatsappNo } = req.body;
        const userId = req.user.uid;
        const merchantTransactionId = uuidv4();
        
        const pendingPayment = {
            userId,
            merchantTransactionId,
            service: service.title,
            amount: Number(amount),
            whatsappNo,
            status: 'PENDING',
            createdAt: new Date(),
            paymentGateway: 'PhonePe'
        };
        await db.collection('pending_payments').doc(merchantTransactionId).set(pendingPayment);

        const paymentData = {
            merchantId: process.env.PHONEPE_MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: userId,
            amount: amount * 100,
            redirectUrl: `https://www.applyforyou.in/payment-status.html?id=${merchantTransactionId}`,
            redirectMode: 'REDIRECT',
            callbackUrl: `${process.env.API_URL}/api/payment/phonepe-callback`,
            mobileNumber: whatsappNo,
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const base64Payload = Buffer.from(JSON.stringify(paymentData)).toString('base64');
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;
        const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const checksum = sha256 + '###' + saltIndex;

        const response = await axios.post(
            `${process.env.PHONEPE_HOST_URL}/pg/v1/pay`,
            { request: base64Payload },
            { headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum } }
        );

        const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
        res.status(200).json({ redirectUrl });

    } catch (error) {
        console.error('PhonePe payment initiation error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'PhonePe payment shuru karne mein samasya aayi.' });
    }
};

export const verifyPhonePePayment = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;

        const apiEndpoint = `/pg/v1/status/${merchantId}/${transactionId}`;
        const stringToHash = apiEndpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const checksum = sha256 + '###' + saltIndex;

        const response = await axios.get(
            `${process.env.PHONEPE_HOST_URL}${apiEndpoint}`,
            { headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum, 'X-MERCHANT-ID': merchantId } }
        );

        if (response.data.code === 'PAYMENT_SUCCESS') {
            const pendingDocRef = db.collection('pending_payments').doc(transactionId);
            const pendingDoc = await pendingDocRef.get();
            if (!pendingDoc.exists) { throw new Error('Pending payment record not found.'); }
            const pendingData = pendingDoc.data();

            const tokenId = await generateNextTokenId();
            const slotDetails = await findNextAvailableSlot();

            const newApplication = {
                userId: pendingData.userId,
                customerName: req.user.name || req.user.email,
                whatsappNo: pendingData.whatsappNo,
                service: pendingData.service,
                amount: pendingData.amount,
                paymentId: response.data.data.transactionId,
                orderId: 'N/A',
                status: 'Processing',
                createdAt: new Date(),
                paymentGateway: 'PhonePe',
                tokenId: tokenId,
                timeSlot: slotDetails ? slotDetails.timeSlot : null,
                slotAssignedAt: slotDetails ? slotDetails.slotAssignedAt : null
            };
            
            await db.collection('payments').add(newApplication);
            await saveApplicationDataToSheet(newApplication);
            await pendingDocRef.delete();

            res.status(200).json({ success: true, applicationData: newApplication });
        } else {
            res.status(400).json({ success: false, message: response.data.message || "PhonePe payment verification failed." });
        }
    } catch (error) {
        console.error('PhonePe verification error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'PhonePe verification mein samasya aayi.' });
    }
};
