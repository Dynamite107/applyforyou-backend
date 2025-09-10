// File: src/controllers/adminController.js (Updated)
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
        const applicationsRef = db.collection('payments').orderBy('createdAt', 'desc');
        const snapshot = await applicationsRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const applications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, // Document ID bhejna zaroori hai
                customerName: data.customerName || 'N/A',
                whatsappNo: data.whatsappNo,
                service: data.service,
                amount: data.amount, // Amount ko joda gaya hai
                paymentId: data.paymentId,
                status: data.status,
                createdAt: data.createdAt // Poora timestamp object bhejein
            };
        });

        res.status(200).json(applications);

    } catch (error) {
        console.error('Error fetching admin applications:', error);
        res.status(500).json({ message: 'Applications fetch karne mein error aaya.' });
    }
};

// ** YEH NAYA FUNCTION JODA GAYA HAI **
export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params; // Application ki ID URL se milegi
        const { status } = req.body; // Naya status body se milega

        if (!status) {
            return res.status(400).json({ message: 'Status zaroori hai.' });
        }

        const applicationRef = db.collection('payments').doc(id);
        await applicationRef.update({ status: status });

        res.status(200).json({ message: 'Status safaltapoorvak update ho gaya.' });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Status update karne mein error aaya.' });
    }
};
