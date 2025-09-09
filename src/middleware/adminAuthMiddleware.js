// =============================================================
// **NEW FILE**
// File: src/middleware/adminAuthMiddleware.js
// Yeh middleware sirf Admin ke JWT token ko verify karta hai.
// =============================================================
import jwt from 'jsonwebtoken';

export const adminProtect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Header se token nikalein
            token = req.headers.authorization.split(' ')[1];

            // Token ko secret key se verify karein
            jwt.verify(token, process.env.JWT_SECRET);

            // Sab theek hai, request ko aage badhne dein
            next(); 

        } catch (error) {
            console.error('Admin token verification fail hua:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
