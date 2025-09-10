// File: src/controllers/userController.js (Updated)
import { db } from '../config/firebase.js';

export const getApplicationHistory = async (req, res) => {
    try {
        const userId = req.user.uid;

        const applicationsRef = db.collection('payments');
        const snapshot = await applicationsRef
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc') // Sabse naya aavedan sabse upar
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const history = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Firestore se timestamp ko aage bhejne ke liye data taiyar karein
            history.push({ 
                id: doc.id,
                service: data.service,
                amount: data.amount,
                status: data.status,
                createdAt: data.createdAt // Poora timestamp object bhej dein
            });
        });

        res.status(200).json(history);

    } catch (error) {
        console.error("Error fetching application history:", error);
        res.status(500).json({ message: "History laane me asamarth." });
    }
};
