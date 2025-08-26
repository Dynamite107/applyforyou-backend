// =============================================================
// File: src/controllers/adminController.js
// Yeh file admin dashboard ke liye applications data ko handle karti hai.
// Isse 'src/controllers' folder mein save karein.
// =============================================================
import { db, auth } from '../config/firebase.js'; // `auth` ko import karein

// NEW: Admin login ko handle karne ke liye naya controller function
export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    
    // .env file se admin credentials lein
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    
    try {
      // Firebase के साथ admin credentials को verify karein
      const userRecord = await auth.getUserByEmail(email);

      if (userRecord.uid && userRecord.email === ADMIN_EMAIL) {
        // Successful login
        res.status(200).json({ message: 'Admin login safal.' });
      } else {
        res.status(401).json({ message: 'Invalid credentials.' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Login mein error aaya.' });
    }
};

export const getAdminApplications = async (req, res) => {
    try {
        // Firestore se saari applications ko fetch karein
        const applicationsRef = db.collection('applications').orderBy('appliedAt', 'desc'); // Sabse naye applications pehle dikhenge
        const snapshot = await applicationsRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const applications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                applicationId: doc.id,
                customerName: data.customerName,
                whatsappNo: data.customerMobile || 'N/A', // CORRECTED: `customerMobile` se data lein
                service: data.serviceTitle,
                paymentId: data.paymentId,
                status: data.status,
                date: data.appliedAt.toDate().toLocaleString('en-IN')
            };
        });

        res.status(200).json(applications);

    } catch (error) {
        console.error('Error fetching admin applications:', error);
        res.status(500).json({ message: 'Applications fetch karne mein error aaya.' });
    }
};
