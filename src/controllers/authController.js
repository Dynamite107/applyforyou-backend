// File: src/controllers/authController.js
// =============================================================
import { db, auth } from '../config/firebase.js';
import { saveUserDataToDrive } from '../helpers/googleDriveHelper.js';

export const registerUser = async (req, res) => {
  // Google Sign-In se uid bhi aa sakta hai
  const { email, password, name, mobile, uid } = req.body;

  // Normal Registration (Email/Password)
  if (password) {
    if (!email || !name || !mobile) {
      return res.status(400).json({ message: 'Kripya sabhi anivarya fields bharein.' });
    }
    try {
      // Yeh section ab istemal nahi hoga kyunki user frontend se ban raha hai,
      // lekin fallback ke liye rakha gaya hai.
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name,
        phoneNumber: `+91${mobile}`
      });

      const userData = { name, email, mobile, createdAt: new Date() };
      await db.collection('users').doc(userRecord.uid).set(userData);
      saveUserDataToDrive({ ...userData, uid: userRecord.uid });
      return res.status(201).json({ message: 'User safaltapoorvak register ho gaya.', uid: userRecord.uid });

    } catch (error) {
      console.error('Registration Error:', error);
      if (error.code === 'auth/email-already-exists') {
          return res.status(400).json({ message: 'Yeh email pehle se register hai.' });
      }
      return res.status(500).json({ message: 'Registration fail ho gaya.', error: error.message });
    }
  }

  // Google Sign-In se naye user ka registration
  else if (uid) {
    if (!email || !name) {
        return res.status(400).json({ message: 'Google se naam ya email nahi mila.' });
    }
    try {
        const userData = {
            name: name,
            email: email,
            mobile: mobile || 'N/A', // Google se mobile hamesha nahi milta
            createdAt: new Date()
        };
        // User pehle se frontend me ban chuka hai, hum bas data save kar rahe hain
        await db.collection('users').doc(uid).set(userData);
        saveUserDataToDrive({ ...userData, uid: uid });
        return res.status(201).json({ message: 'Google se user safaltapoorvak register ho gaya.', uid: uid });

    } catch (error) {
        console.error('Google User Registration Error:', error);
        return res.status(500).json({ message: 'Google user ko save karne me error.', error: error.message });
    }
  }
  
  // Agar na password hai na uid, to request galat hai
  else {
    return res.status(400).json({ message: 'Invalid registration request.' });
  }
};
