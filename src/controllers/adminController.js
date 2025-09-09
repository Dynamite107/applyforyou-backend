// =============================================================
// File: src/controllers/adminController.js (Updated)
// =============================================================
import { db } from '../config/firebase.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        res.status(200).json({
            message: 'Admin login safal.',
            token: generateToken('admin_user_id')
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
};

export const getAdminApplications = async (req, res) => {
    try {
        // **YAHAN BADLAV KIYA GAYA HAI: Collection ka naam 'payments' kiya gaya hai**
        const applicationsRef = db.collection('payments').orderBy('createdAt', 'desc');
        const snapshot = await applicationsRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const applications = snapshot.docs.map(doc => {
            const data = doc.data();
            const date = data.createdAt && data.createdAt.toDate 
                ? data.createdAt.toDate().toLocaleDateString('en-IN') 
                : 'N/A';

            return {
                applicationId: doc.id,
                customerName: data.customerName || 'N/A',
                whatsappNo: data.whatsappNo,
                service: data.service,
                paymentId: data.paymentId,
                status: data.status,
                date: date
            };
        });

        res.status(200).json(applications);

    } catch (error) {
        console.error('Error fetching admin applications:', error);
        res.status(500).json({ message: 'Applications fetch karne mein error aaya.' });
    }
};
