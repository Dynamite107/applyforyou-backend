// =============================================================
// **NEW FILE**
// File: src/controllers/userController.js
// Yeh file user ki form history ko handle karti hai.
// Isse 'src/controllers' folder mein save karein.
// =============================================================
import { db } from '../config/firebase.js';

// User ki form history fetch karne ke liye function
export const getFormHistory = async (req, res) => {
  try {
    const userId = req.user.uid; // Auth middleware se user ki ID
    
    if (!userId) {
      return res.status(401).json({ message: 'User authenticated nahi hai.' });
    }

    // Firestore se applications ko fetch karein
    // **Yahan badlav kiya gaya hai: Collection ka naam 'payments' hai**
    const applicationsRef = db.collection('payments').where('userId', '==', userId);
    const snapshot = await applicationsRef.get();

    if (snapshot.empty) {
      return res.status(200).json([]); // Empty array return karein agar koi history nahi hai
    }

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure appliedAt exists and is a timestamp before converting
      const appliedDate = data.appliedAt && data.appliedAt.toDate 
        ? data.appliedAt.toDate().toISOString().split('T')[0] 
        : 'N/A';

      return {
        applicationId: doc.id,
        serviceName: data.serviceTitle,
        appliedDate: appliedDate,
        deliveryDate: data.deliveryDate || 'N/A', // Provide a default value
        status: data.status,
      };
    });

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching form history:', error);
    res.status(500).json({ message: 'Form history fetch karne mein error aaya.' });
  }
};

