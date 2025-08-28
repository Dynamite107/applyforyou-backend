// =============================================================
// File: src/controllers/authController.js
// =============================================================
import { db } from '../config/firebase.js';
// saveUserDataToDrive function ko abhi ke liye comment kar rahe hain, agar zaroorat ho to uncomment karein
// import { saveUserDataToDrive } from '../helpers/googleDriveHelper.js';

export const registerUser = async (req, res) => {
  // Frontend se humesha uid, name, email, aur mobile aayega
  const { uid, name, email, mobile } = req.body;

  // Check karein ki zaroori data mila ya nahi
  if (!uid || !name || !email) {
    return res.status(400).json({ message: 'Request me zaroori jaankari (uid, name, email) nahi hai.' });
  }

  try {
    // User ka data Firestore database mein save karne ke liye object banayein
    const userData = {
      name: name,
      email: email,
      mobile: mobile || 'N/A', // Agar mobile nahi hai to 'N/A' save karein
      createdAt: new Date()
    };

    // User ke UID ko document ID banakar data 'users' collection mein save karein
    await db.collection('users').doc(uid).set(userData);
    
    // Agar Google Drive me save karna hai to is line ko chalu rakhein
    // saveUserDataToDrive({ ...userData, uid: uid });
    
    // Safaltapoorvak response bhejein
    return res.status(201).json({ message: 'User safaltapoorvak register ho gaya.', uid: uid });

  } catch (error) {
    // Agar koi error aata hai to use log karein aur error response bhejein
    console.error('User data save karne me Error:', error);
    return res.status(500).json({ message: 'User data save karne me fail ho gaya.', error: error.message });
  }
};
