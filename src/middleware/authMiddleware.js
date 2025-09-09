// =============================================================
// **CORRECT FILE FOR FIREBASE AUTHENTICATION**
// File: src/middleware/authMiddleware.js
// Yeh file Firebase token ko verify karti hai.
// =============================================================
import { admin } from '../config/firebase.js';

// Is middleware ka naam 'protect' rakha gaya hai
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Koi token nahi mila.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Firebase Admin SDK se token ko verify karein (Sahi Tarika)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // User ki jaankari (jaise UID) ko request object me jod dein
    // taki agla function (userController) iska istemal kar sake
    req.user = decodedToken; 
    
    next(); // Sab theek hai, ab agle function par jao
  } catch (error) {
    console.error('Token verify karne me error:', error);
    return res.status(401).json({ message: 'Unauthorized: Token anuchit hai.' });
  }
};
