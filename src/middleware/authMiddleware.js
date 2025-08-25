// =============================================================
// File: middleware/authMiddleware.js
// Is code ko 'middleware' folder ke andar 'authMiddleware.js' naam se save karein.
// =============================================================
import { auth as adminAuth } from 'firebase-admin';

const authInstance = adminAuth();

// Yeh function routes ko protect karta hai
export const protect = async (req, res, next) => {
  let token;
  
  // Check karein ki request ke header mein 'Bearer' token hai ya nahi
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Header se token nikaalein
      token = req.headers.authorization.split(' ')[1];
      
      // Firebase se token ko verify karein
      const decodedToken = await authInstance.verifyIdToken(token);
      
      // User ki details ko request ke saath jod dein
      req.user = decodedToken;
      
      // Agle step par jaane ki anumati dein
      next();

    } catch (error) {
      console.error('Token verification fail ho gaya', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Agar token nahi hai, to error bhej dein
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
