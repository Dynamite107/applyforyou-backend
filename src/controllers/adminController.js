// =============================================================
// File: src/controllers/adminController.js (Final and Corrected)
// =============================================================
import { db } from '../config/firebase.js';
import jwt from 'jsonwebtoken'; // Is line ko add karein

// Yeh function token banata hai
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token 1 din mein expire ho jayega
    });
};

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    
    // .env file se admin credentials lein
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Seedhe .env se aaye credentials ko check karein
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // **YAHI SABSE ZAROORI BADLAV HAI**
        // Successful login par, token banakar bhejein
        res.status(200).json({
            message: 'Admin login safal.',
            token: generateToken('admin_user_id') // Token yahan ban raha hai
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
};

export const getAdminApplications = async (req, res) => {
    try {
        // Firestore se saari applications ko fetch karein
        const applicationsRef = db.collection('applications').orderBy('createdAt', 'desc');
        const snapshot = await applicationsRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const applications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                applicationId: doc.id,
                customerName: data.customerName,
                whatsappNo: data.whatsappNo,
                service: data.service,
                paymentId: data.paymentId,
                status: data.status,
                date: new Date(data.createdAt).toLocaleDateString('en-IN')
            };
        });

        res.status(200).json(applications);

    } catch (error) {
        console.error('Error fetching admin applications:', error);
        res.status(500).json({ message: 'Applications fetch karne mein error aaya.' });
    }
};
