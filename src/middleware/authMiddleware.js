// =============================================================
// File: src/middleware/authMiddleware.js (Final and Corrected)
// =============================================================
import jwt from 'jsonwebtoken';
import { auth } from '../config/firebase.js';

// Yeh function ab admin token ko check karega
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Header se token nikalein
      token = req.headers.authorization.split(' ')[1];

      // **YAHI SABSE ZAROORI BADLAV HAI**
      // Token ko secret key se verify karein
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Hum decoded data ko request me daal rahe hain, taaki aage istemal ho sake
      // (Abhi iski zaroorat nahi hai, lekin future ke liye accha hai)
      // req.admin = decoded; 

      next(); // Sab theek hai, request ko aage badhne dein

    } catch (error) {
      console.error('Token verification failed', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
